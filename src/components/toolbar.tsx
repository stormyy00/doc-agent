import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { Level } from "@/types/log";

type LogFilter = {
  levels: Set<Level>;
  showToolCalls: boolean;
  showToolResults: boolean;
  showRegularLogs: boolean;
  searchTerm: string;
};

interface ToolbarProps {
  filter: LogFilter;
  setFilter: (value: any) => void;
  logStats: logStats | undefined;
}

type logStats = {
  total: number;
  byLevel: Record<string, number>;
  toolCalls: number;
  toolResults: number;
};

const Toolbar = ({ filter, setFilter, logStats }: ToolbarProps) => {
  const toggleLevel = (level: Level) => {
    const newLevels = new Set(filter.levels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setFilter((prev: LogFilter) => ({ ...prev, levels: newLevels }));
  };
  const allLevels: Level[] = ["debug", "info", "warn", "error"];
  return (
    <div className="p-3 border-b bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level Filters */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Log Levels</Label>
          <div className="flex flex-wrap gap-1">
            {allLevels.map((level) => (
              <Button
                key={level}
                variant={filter.levels.has(level) ? "default" : "outline"}
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => toggleLevel(level)}
              >
                {level}
                {logStats?.byLevel[level] && (
                  <span className="ml-1 text-xs opacity-70">
                    ({logStats.byLevel[level]})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Log Types</Label>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Switch
                id="tool-calls"
                checked={filter.showToolCalls}
                onCheckedChange={(checked: boolean) =>
                  setFilter((prev: LogFilter) => ({
                    ...prev,
                    showToolCalls: checked,
                  }))
                }
              />
              <Label htmlFor="tool-calls" className="text-xs">
                Tool Calls ({logStats?.toolCalls || 0})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="tool-results"
                checked={filter.showToolResults}
                onCheckedChange={(checked: boolean) =>
                  setFilter((prev: LogFilter) => ({
                    ...prev,
                    showToolResults: checked,
                  }))
                }
              />
              <Label htmlFor="tool-results" className="text-xs">
                Tool Results ({logStats?.toolResults || 0})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="regular-logs"
                checked={filter.showRegularLogs}
                onCheckedChange={(checked: boolean) =>
                  setFilter((prev: LogFilter) => ({
                    ...prev,
                    showRegularLogs: checked,
                  }))
                }
              />
              <Label htmlFor="regular-logs" className="text-xs">
                Regular Logs
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Search</Label>
          <input
            type="text"
            placeholder="Search logs..."
            value={filter.searchTerm}
            onChange={(e) =>
              setFilter((prev: LogFilter) => ({
                ...prev,
                searchTerm: e.target.value,
              }))
            }
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Quick Actions</Label>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() =>
                setFilter((prev: LogFilter) => ({
                  ...prev,
                  levels: new Set(allLevels),
                  showToolCalls: true,
                  showToolResults: true,
                  showRegularLogs: true,
                  searchTerm: "",
                }))
              }
            >
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() =>
                setFilter((prev: LogFilter) => ({
                  ...prev,
                  levels: new Set<Level>(["error", "warn"]),
                  showToolCalls: false,
                  showToolResults: false,
                  showRegularLogs: true,
                  searchTerm: "",
                }))
              }
            >
              Errors Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
