import { Sequelize } from "sequelize";
import pg from "pg"; // Explicitly import pg

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  dialectModule: pg, // Use pg explicitly
  logging: false, // Optional: disable logging
});

export default sequelize;
