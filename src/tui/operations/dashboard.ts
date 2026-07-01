import type { TuiOperation } from "../types";
import { inferRepoOptional } from "./shared";
import notificationsService from "@/services/notifications";

const dashboardOperations: TuiOperation[] = [
  {
    command: "gitfleet tui",
    workspace: "Dashboard",
    id: "dashboard.overview",
    title: "Dashboard Overview",
    description: "Show active profile and activity summary.",

    run: async () => {
      const repo = await inferRepoOptional();

      return {
        repo,
        activity: await notificationsService.activity(),
      };
    },
  },
];

export default dashboardOperations;
