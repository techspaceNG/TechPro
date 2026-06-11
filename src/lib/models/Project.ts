import mongoose, { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'in_progress', 'completed'],
      default: 'active',
    },
    progress: {
      type: Number,
      default: 0,
    },
    tasks: [TaskSchema],
  },
  {
    timestamps: true,
  }
);

const Project = models.Project || model('Project', ProjectSchema);
export default Project;
