import { Metadata } from "next";
import DashboardContent from "../components/DashboardContent";

export const metadata: Metadata = {
  title: "Agent Dashboard - Empiric Technology",
  description: "Monitor and handle customer conversations",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
