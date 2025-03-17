import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../lib/sequelize";

// Define the interface for Chat attributes
interface ChatAttributes {
  id: string;
  sessionId: string;
  userMessage: string | null;
  botResponse: string | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional attributes for creation (ID is generated)
interface ChatCreationAttributes extends Optional<ChatAttributes, "id"> {}

// Define the Chat model with proper TypeScript definitions
class Chat
  extends Model<ChatAttributes, ChatCreationAttributes>
  implements ChatAttributes
{
  declare id: string;
  declare sessionId: string;
  declare userMessage: string | null;
  declare botResponse: string | null;
  declare status: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userMessage: {
      type: DataTypes.TEXT,
      allowNull: true, // Allow null for agent messages
    },
    botResponse: {
      type: DataTypes.TEXT,
      allowNull: true, // Allow null for pending responses
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "completed",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Chat",
  }
);

export default Chat;
  