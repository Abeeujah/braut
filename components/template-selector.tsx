"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface Template {
  id: string
  name: string
  description?: string
  template_html: string
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void
}

export function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("ticket_templates").select("*")

        if (error) throw error
        setTemplates(data || [])
        if (data && data.length > 0) {
          const defaultTemplate = data.find((t) => t.is_default) || data[0]
          setSelectedId(defaultTemplate.id)
          onTemplateSelect(defaultTemplate)
        }
      } catch (error) {
        console.error("Error fetching templates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [onTemplateSelect])

  const handleChange = (id: string) => {
    setSelectedId(id)
    const template = templates.find((t) => t.id === id)
    if (template) {
      onTemplateSelect(template)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Ticket Template:</label>
      <Select value={selectedId || ""} onValueChange={handleChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
              {template.description && ` - ${template.description}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
