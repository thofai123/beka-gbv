import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FileText, Image, Mic, File, Plus, X, GripVertical, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import moment from "moment";

const typeConfig = {
  photo: { icon: Image, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  audio: { icon: Mic, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  document: { icon: FileText, color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  zp_form_32: { icon: FileText, color: "bg-red-500/10 text-red-600 border-red-200" },
  other: { icon: File, color: "bg-gray-500/10 text-gray-600 border-gray-200" },
};

function EvidenceChip({ file, isDragging }) {
  const cfg = typeConfig[file.file_type] || typeConfig.other;
  const Icon = cfg.icon;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-grab active:cursor-grabbing transition-shadow ${cfg.color} ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <GripVertical className="w-3 h-3 opacity-40 flex-shrink-0" />
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-medium truncate max-w-[140px]">{file.file_name}</span>
    </div>
  );
}

export default function EvidenceTimeline({ files }) {
  // placements: { [fileId]: dateString (YYYY-MM-DD) }
  const [placements, setPlacements] = useState({});
  const [newDate, setNewDate] = useState("");
  const [customDates, setCustomDates] = useState([]);

  const placedIds = new Set(Object.keys(placements));
  const unplaced = files.filter((f) => !placedIds.has(f.id));

  // All dates on the timeline (from placements + custom)
  const timelineDates = useMemo(() => {
    const fromPlacements = Object.values(placements);
    const all = [...new Set([...customDates, ...fromPlacements])].filter(Boolean);
    return all.sort();
  }, [placements, customDates]);

  const itemsByDate = useMemo(() => {
    const map = {};
    for (const [fileId, date] of Object.entries(placements)) {
      if (!map[date]) map[date] = [];
      const file = files.find((f) => f.id === fileId);
      if (file) map[date].push(file);
    }
    return map;
  }, [placements, files]);

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const destId = destination.droppableId;
    if (destId === "unplaced") {
      // Remove from placements
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[draggableId];
        return next;
      });
    } else {
      // Place on a date
      setPlacements((prev) => ({ ...prev, [draggableId]: destId }));
    }
  };

  const addDate = () => {
    if (!newDate || customDates.includes(newDate)) return;
    setCustomDates((prev) => [...prev, newDate]);
    setNewDate("");
  };

  const removeDate = (date) => {
    // Unplace items on this date
    setPlacements((prev) => {
      const next = { ...prev };
      for (const [id, d] of Object.entries(next)) {
        if (d === date) delete next[id];
      }
      return next;
    });
    setCustomDates((prev) => prev.filter((d) => d !== date));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Unplaced pool */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Unplaced ({unplaced.length})
            </p>
            <Droppable droppableId="unplaced">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/30 p-2" : ""
                  }`}
                >
                  {unplaced.length === 0 && !snapshot.isDraggingOver && (
                    <p className="text-xs text-muted-foreground text-center py-4">All items placed!</p>
                  )}
                  {unplaced.map((file, i) => (
                    <Draggable key={file.id} draggableId={file.id} index={i}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <EvidenceChip file={file} isDragging={snap.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 space-y-4">
          {/* Add date control */}
          <div className="flex gap-2 items-center">
            <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-8 text-sm w-44"
            />
            <Button size="sm" variant="outline" onClick={addDate} className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" /> Add Date
            </Button>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Add date markers, then drag evidence onto them
            </p>
          </div>

          {timelineDates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border text-center gap-2">
              <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No dates yet</p>
              <p className="text-xs text-muted-foreground">Add a date above to start mapping your incident timeline</p>
            </div>
          )}

          {/* Date rows */}
          <div className="relative">
            {timelineDates.length > 0 && (
              <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-border" />
            )}
            <div className="space-y-4">
              {timelineDates.map((date) => {
                const items = itemsByDate[date] || [];
                return (
                  <div key={date} className="flex gap-4 items-start">
                    {/* Date label */}
                    <div className="w-[88px] flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {moment(date).format("D MMM")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{moment(date).format("YYYY")}</p>
                    </div>

                    {/* Node */}
                    <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow flex-shrink-0 mt-1 z-10" />

                    {/* Drop zone */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs text-muted-foreground">
                          {moment(date).format("dddd, D MMMM YYYY")}
                        </p>
                        <button
                          onClick={() => removeDate(date)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <Droppable droppableId={date} direction="horizontal">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[52px] flex flex-wrap gap-2 rounded-xl border-2 border-dashed p-2 transition-colors ${
                              snapshot.isDraggingOver
                                ? "border-primary/50 bg-primary/5"
                                : items.length === 0
                                ? "border-border/60"
                                : "border-transparent bg-muted/30"
                            }`}
                          >
                            {items.length === 0 && !snapshot.isDraggingOver && (
                              <p className="text-xs text-muted-foreground/50 self-center px-2">
                                Drop evidence here
                              </p>
                            )}
                            {items.map((file, i) => (
                              <Draggable key={file.id} draggableId={file.id} index={i}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                  >
                                    <EvidenceChip file={file} isDragging={snap.isDragging} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}