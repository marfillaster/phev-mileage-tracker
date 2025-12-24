import { Github } from "lucide-react"

export function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || new Date().toISOString().split("T")[0].replace(/-/g, ".")

  return (
    <footer className="border-t border-border mt-12 py-6">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} marfillaster</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">v{version}</span>
          </div>
          <a
            href="https://github.com/marfillaster/phev-mileage-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
