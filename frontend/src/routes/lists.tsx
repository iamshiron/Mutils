import {createFileRoute} from "@tanstack/react-router";
import {ListPlus, ListChecks} from "@phosphor-icons/react";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

export const Route = createFileRoute("/lists")({
    component: ListsPage,
});

function ListsPage() {
    return (
        <div>
        </div>
    );
}
