'use client'

import Link from 'next/link'

import {
  Calendar, ChevronDown, Home, ChevronsUpDown,
  Workflow, FishSymbol, Sparkles, AudioLines
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"


// Menu items.
const items = [
  {
    title: "Text to Speech",
    url: "/tts",
    icon: AudioLines,
  },
]

// Framework items
const frameworks = [
  {
    title: "GPT-SoVits",
    icon: Sparkles,
  },
  {
    title: "Fish-Speech",
    icon: FishSymbol,
  },
]

export function AppSidebar() {
  const [selectedFramework, setSelectedFramework] = useState(frameworks[0])

  return (
    <Sidebar collapsible="icon" variant='inset'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <selectedFramework.icon />
                  {selectedFramework.title}
                  <ChevronsUpDown />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>Frameworks</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {frameworks.map((framework) => (
                  <DropdownMenuItem key={framework.title} onClick={() => setSelectedFramework(framework)}>
                    <span>{framework.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Functionality</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
