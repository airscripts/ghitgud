import config from "@/core/config";
import type { TuiOperation } from "../types";
import notificationsService from "@/services/notifications";

const dashboardOperations: TuiOperation[] = [
  {
    command: "ghg tui",
    workspace: "Dashboard",
    id: "dashboard.overview",
    title: "Dashboard Overview",
    description: "Show active profile, configured repo, and activity summary.",

    run: async () => ({
      repo: config.getRepoOptional(),
      profiles: config.listProfiles(),
      activity: await notificationsService.activity(),
    }),
  },
];

export default dashboardOperations;
