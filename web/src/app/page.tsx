import { redirect } from "next/navigation";
import { LAUNCH_TIME } from "@/lib/launch-time";

export default function HomePage() {
  redirect(Date.now() >= LAUNCH_TIME.getTime() ? "/leaderboard" : "/exhibition");
}
