import mongoose, { Schema, model, models } from 'mongoose';

const CredentialSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // Can be global or project-specific
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    site: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String, // Stored encrypted as iv:authTag:encryptedData
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Credential = models.Credential || model('Credential', CredentialSchema);
export default Credential;
