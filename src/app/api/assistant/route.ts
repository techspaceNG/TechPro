import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Credential from '@/lib/models/Credential';
import Note from '@/lib/models/Note';
import { encrypt } from '@/lib/encryption';

// Helper to find project by name or ID
async function resolveProject(projectNameOrId: string) {
  if (!projectNameOrId) return null;
  const cleaned = projectNameOrId.trim();
  
  // 1. Try Mongoose ObjectID
  if (cleaned.match(/^[0-9a-fA-F]{24}$/)) {
    const project = await Project.findById(cleaned);
    if (project) return project;
  }
  
  // 2. Try Exact Name Case-Insensitive
  const projectExact = await Project.findOne({ name: new RegExp(`^${cleaned}$`, 'i') });
  if (projectExact) return projectExact;
  
  // 3. Try Partial Name Case-Insensitive
  const projectPartial = await Project.findOne({ name: new RegExp(cleaned, 'i') });
  return projectPartial;
}

// Gemini parameters require UPPERCASE types (OBJECT, STRING, BOOLEAN, etc.)
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'get_projects',
        description: 'Retrieve a list of all active projects in the workspace.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        }
      },
      {
        name: 'create_project',
        description: 'Create a new development project inside the database.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The name/title of the project.' },
            description: { type: 'STRING', description: 'Overview of the project objectives.' },
            status: { type: 'STRING', enum: ['active', 'in_progress', 'completed'], description: 'Initial status.' }
          },
          required: ['name']
        }
      },
      {
        name: 'add_task',
        description: 'Add a new task or milestone to an existing project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectNameOrId: { type: 'STRING', description: 'The name or ID of the project to add the task to.' },
            taskTitle: { type: 'STRING', description: 'The title of the task.' }
          },
          required: ['projectNameOrId', 'taskTitle']
        }
      },
      {
        name: 'toggle_task',
        description: 'Mark a task as completed (true) or incomplete (false) inside a project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectNameOrId: { type: 'STRING', description: 'The name or ID of the project.' },
            taskTitleOrId: { type: 'STRING', description: 'The title or ID of the task to toggle.' },
            completed: { type: 'BOOLEAN', description: 'True to check as done, false to uncheck.' }
          },
          required: ['projectNameOrId', 'taskTitleOrId', 'completed']
        }
      },
      {
        name: 'save_credential',
        description: 'Save website login credentials (username, password) to the vault. Mapped to a project or global.',
        parameters: {
          type: 'OBJECT',
          properties: {
            site: { type: 'STRING', description: 'The website or service name (e.g. AWS, GitHub).' },
            username: { type: 'STRING', description: 'The login email/username.' },
            password: { type: 'STRING', description: 'The password to encrypt and save.' },
            projectNameOrId: { type: 'STRING', description: 'Optional. Project name or ID to map this credential.' },
            notes: { type: 'STRING', description: 'Optional. Explanatory note (e.g. read-only token).' }
          },
          required: ['site', 'username', 'password']
        }
      },
      {
        name: 'add_note',
        description: 'Create a wiki markdown note linked to a project or global note.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'The title of the note.' },
            content: { type: 'STRING', description: 'The markdown body content.' },
            projectNameOrId: { type: 'STRING', description: 'Optional. Project name or ID to link note.' },
            isGlobal: { type: 'BOOLEAN', description: 'True if note is global, false if linked to project.' }
          },
          required: ['title', 'content']
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    await dbConnect();

    // Map frontend messages {role, content} to Gemini {role, parts} format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 1. Call Gemini (gemini-flash-latest) with Tools declared
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{
              text: `You are the TechPro Workspace Assistant. 
You can help the user manage projects, toggle milestones, save encrypted passwords in the vault, and log wiki notes. 
Execute database tasks dynamically using your declared tools. 
Always summarize the actions you took in a professional, brief technical tone.`
            }]
          },
          tools: geminiTools,
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const functionCall = part?.functionCall;

    // If Gemini does NOT want to use a tool, return the text response directly
    if (!functionCall) {
      return NextResponse.json({ 
        role: 'assistant', 
        content: part?.text || 'I am here to assist with your workspace.'
      });
    }

    // 2. Process the Tool Call
    const toolName = functionCall.name;
    const toolInput = functionCall.args;
    let toolResult: any = null;

    try {
      if (toolName === 'get_projects') {
        const projectsList = await Project.find({}).select('name status progress tasks description');
        toolResult = { success: true, count: projectsList.length, projects: projectsList };
      } 
      
      else if (toolName === 'create_project') {
        const { name, description, status } = toolInput;
        const newProj = await Project.create({
          name,
          description: description || '',
          status: status || 'active',
          progress: 0,
          tasks: [],
        });
        toolResult = { success: true, project: newProj };
      } 
      
      else if (toolName === 'add_task') {
        const { projectNameOrId, taskTitle } = toolInput;
        const project = await resolveProject(projectNameOrId);
        if (!project) {
          toolResult = { success: false, error: `Project '${projectNameOrId}' not found.` };
        } else {
          project.tasks.push({
            id: Date.now().toString(),
            title: taskTitle,
            completed: false,
          });
          const totalTasks = project.tasks.length;
          const completedTasks = project.tasks.filter((t: any) => t.completed).length;
          project.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          await project.save();
          toolResult = { success: true, project };
        }
      } 
      
      else if (toolName === 'toggle_task') {
        const { projectNameOrId, taskTitleOrId, completed } = toolInput;
        const project = await resolveProject(projectNameOrId);
        if (!project) {
          toolResult = { success: false, error: `Project '${projectNameOrId}' not found.` };
        } else {
          let task = project.tasks.find((t: any) => t.id === taskTitleOrId);
          if (!task) {
            task = project.tasks.find((t: any) => t.title.toLowerCase().includes(taskTitleOrId.toLowerCase()));
          }

          if (!task) {
            toolResult = { success: false, error: `Task '${taskTitleOrId}' not found in project.` };
          } else {
            task.completed = completed;
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t: any) => t.completed).length;
            project.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            await project.save();
            toolResult = { success: true, project };
          }
        }
      } 
      
      else if (toolName === 'save_credential') {
        const { site, username, password, projectNameOrId, notes } = toolInput;
        let project = null;
        if (projectNameOrId) {
          project = await resolveProject(projectNameOrId);
        }

        const encryptedPass = encrypt(password);
        const newCred = await Credential.create({
          site,
          username,
          password: encryptedPass,
          project: project ? project._id : null,
          notes: notes || '',
        });

        toolResult = { 
          success: true, 
          credential: {
            _id: newCred._id,
            site: newCred.site,
            username: newCred.username,
            project: project ? project.name : 'Global',
            notes: newCred.notes
          } 
        };
      } 
      
      else if (toolName === 'add_note') {
        const { title, content, projectNameOrId, isGlobal } = toolInput;
        let project = null;
        if (projectNameOrId) {
          project = await resolveProject(projectNameOrId);
        }

        const newNote = await Note.create({
          title,
          content,
          project: project ? project._id : null,
          isGlobal: isGlobal ?? !project,
        });

        toolResult = { 
          success: true, 
          note: {
            _id: newNote._id,
            title: newNote.title,
            project: project ? project.name : 'Global'
          } 
        };
      }
    } catch (dbErr: any) {
      toolResult = { success: false, error: dbErr.message };
    }

    // 3. Send tool results back to Gemini for final natural language explanation
    const followUpContents = [
      ...contents,
      {
        role: 'model',
        parts: [{ functionCall }]
      },
      {
        role: 'function',
        parts: [{
          functionResponse: {
            name: toolName,
            response: toolResult
          }
        }]
      }
    ];

    const followUpResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: followUpContents,
          systemInstruction: {
            parts: [{
              text: `You are the TechPro Workspace Assistant. Summarize the actions taken briefly in a friendly, clear developer tone.`
            }]
          }
        })
      }
    );

    if (!followUpResponse.ok) {
      const errText = await followUpResponse.text();
      throw new Error(`Gemini API follow-up error: ${errText}`);
    }

    const followUpData = await followUpResponse.json();
    const finalText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text || 'Action completed successfully.';

    return NextResponse.json({
      role: 'assistant',
      content: finalText
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
