"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Participant } from "@/types";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  creatorId?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function ParticipantList({ participants, currentUserId, creatorId }: ParticipantListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Participants ({participants.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center gap-2 p-2 rounded-lg border ${
              participant.id === currentUserId ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`text-white text-xs ${getAvatarColor(participant.name)}`}>
                {getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {participant.name}
                {participant.id === currentUserId && " (you)"}
              </span>
              <div className="flex gap-1">
                {participant.id === creatorId && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Host
                  </Badge>
                )}
                <Badge
                  variant={participant.status === "ready" ? "default" : "outline"}
                  className="text-xs px-1 py-0"
                >
                  {participant.status === "ready" ? "✓ Done" : "Selecting"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
