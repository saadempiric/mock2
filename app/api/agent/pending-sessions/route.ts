import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";
import { Op } from "sequelize";
import sequelize from "../../../lib/sequelize";

export async function GET() {
  try {
    // Find sessions with handoff status
    const pendingSessions = await Chat.findAll({
      attributes: [
        "sessionId",
        [sequelize.fn("MAX", sequelize.col("createdAt")), "lastActivity"],
        [sequelize.fn("COUNT", sequelize.col("id")), "messageCount"],
      ],
      where: {
        status: {
          [Op.in]: ["needs_handoff", "pending_agent"],
        },
      },
      group: ["sessionId"],
      order: [[sequelize.fn("MAX", sequelize.col("createdAt")), "DESC"]], // Fix here
    });

    return NextResponse.json({
      sessions: pendingSessions.map((session: any) => ({
        sessionId: session.sessionId,
        lastActivity: session.dataValues.lastActivity,
        messageCount: session.dataValues.messageCount,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
