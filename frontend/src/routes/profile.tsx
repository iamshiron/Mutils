import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Kakera Badges</h2>
            <div>
            </div>

            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Tower Levels Badges</h2>
            <div>
            </div>
        </div>
    )
}
