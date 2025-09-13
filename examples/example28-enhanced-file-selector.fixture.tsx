import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable"
import { useEventHandler } from "lib/components/RunFrameForCli/useEventHandler"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEventHandler(async (event) => {
    if (event.event_type === "REQUEST_TO_SAVE_SNIPPET") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (!event.snippet_name) {
        pushEvent({
          event_type: "FAILED_TO_SAVE_SNIPPET",
          error_code: "SNIPPET_UNSET",
          available_snippet_names: [
            "my-snippet-1",
            "my-snippet-2",
            "led-driver-board",
            "555-timer",
            "my-snippet-3",
            "my-snippet-4",
            "epaper-display",
            "voltage-regulator",
            "led-matrix-9x9",
            "led-matrix-16x16",
            "led-matrix-24x24",
            "led-matrix-32x32",
            "led-matrix-40x40",
          ],
        })
      } else {
        pushEvent({
          event_type: "SNIPPET_SAVED",
        })
      }
    }
  })

  useEffect(() => {
    setTimeout(async () => {
      // Reset events
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Create a comprehensive nested file structure for testing
      const filesToCreate = [
        // Root level files
        {
          path: "main.tsx",
          content: `import manualEdits from "./manual-edits.json"

export default () => (
  <board width="10mm" height="10mm" manualEdits={manualEdits}>
    <resistor name="R1" resistance="1k" footprint="0402" />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
    <trace from=".R1 .pin1" to=".C1 .pin1" />
  </board>
)`,
        },
        {
          path: "manual-edits.json",
          content: JSON.stringify({}),
        },
        {
          path: "config.ts",
          content: `export const config = {
  version: "1.0.0",
  debug: true
}`,
        },
        {
          path: "index.tsx",
          content: `// Alternative entrypoint
export default () => (
  <board width="5mm" height="5mm">
    <resistor name="R1" resistance="2k" footprint="0603" />
  </board>
)`,
        },
        {
          path: "entrypoint.tsx",
          content: `// Another entrypoint option
export default () => (
  <board width="8mm" height="8mm">
    <capacitor name="C1" capacitance="2uF" footprint="0805" />
  </board>
)`,
        },
        {
          path: "manual-edit.json",
          content: JSON.stringify({ alternative: true }),
        },
        {
          path: "app.tsx",
          content: `// App component
export default () => (
  <board width="12mm" height="12mm">
    <led name="LED1" color="red" />
  </board>
)`,
        },
        {
          path: "src/index.tsx",
          content: `// Nested index file
export default () => (
  <board width="6mm" height="6mm">
    <resistor name="R1" resistance="3k" footprint="0402" />
  </board>
)`,
        },

        // Components directory
        {
          path: "components/Button.tsx",
          content: `export const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="btn">
    {children}
  </button>
)`,
        },
        {
          path: "components/Input.tsx",
          content: `export const Input = ({ value, onChange, placeholder }) => (
  <input 
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    className="input"
  />
)`,
        },
        {
          path: "components/Modal.tsx",
          content: `export const Modal = ({ isOpen, onClose, children }) => (
  isOpen ? (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
)`,
        },

        // Components/forms subdirectory
        {
          path: "components/forms/LoginForm.tsx",
          content: `import { Button } from "../Button"
import { Input } from "../Input"

export const LoginForm = () => (
  <form>
    <Input placeholder="Email" />
    <Input placeholder="Password" type="password" />
    <Button>Login</Button>
  </form>
)`,
        },
        {
          path: "components/forms/RegisterForm.tsx",
          content: `import { Button } from "../Button"
import { Input } from "../Input"

export const RegisterForm = () => (
  <form>
    <Input placeholder="Name" />
    <Input placeholder="Email" />
    <Input placeholder="Password" type="password" />
    <Button>Register</Button>
  </form>
)`,
        },
        {
          path: "components/forms/ContactForm.tsx",
          content: `import { Button } from "../Button"
import { Input } from "../Input"

export const ContactForm = () => (
  <form>
    <Input placeholder="Name" />
    <Input placeholder="Email" />
    <Input placeholder="Message" />
    <Button>Send</Button>
  </form>
)`,
        },

        // Components/ui subdirectory
        {
          path: "components/ui/Card.tsx",
          content: `export const Card = ({ children, className }) => (
  <div className={\`card \${className || ''}\`}>
    {children}
  </div>
)`,
        },
        {
          path: "components/ui/Header.tsx",
          content: `export const Header = ({ title, subtitle }) => (
  <header>
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </header>
)`,
        },
        {
          path: "components/ui/Footer.tsx",
          content: `export const Footer = () => (
  <footer>
    <p>&copy; 2024 My App</p>
  </footer>
)`,
        },

        // Utils directory
        {
          path: "utils/helpers.ts",
          content: `export const formatDate = (date: Date) => {
  return date.toLocaleDateString()
}

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}`,
        },
        {
          path: "utils/constants.ts",
          content: `export const API_BASE_URL = 'https://api.example.com'
export const MAX_RETRIES = 3
export const TIMEOUT = 5000`,
        },
        {
          path: "utils/validation.ts",
          content: `export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidPassword = (password: string) => {
  return password.length >= 8
}`,
        },

        // Utils/api subdirectory
        {
          path: "utils/api/client.ts",
          content: `export class ApiClient {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  async get(endpoint: string) {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`)
    return response.json()
  }
}`,
        },
        {
          path: "utils/api/endpoints.ts",
          content: `export const endpoints = {
  users: '/users',
  posts: '/posts',
  comments: '/comments'
}`,
        },

        // Hooks directory
        {
          path: "hooks/useLocalStorage.ts",
          content: `import { useState, useEffect } from 'react'

export const useLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(() => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}`,
        },
        {
          path: "hooks/useApi.ts",
          content: `import { useState, useEffect } from 'react'

export const useApi = (url: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [url])

  return { data, loading, error }
}`,
        },

        // Types directory
        {
          path: "types/index.ts",
          content: `export interface User {
  id: string
  name: string
  email: string
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
}`,
        },
        {
          path: "types/api.ts",
          content: `export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
  }
}`,
        },

        // Styles directory
        {
          path: "styles/globals.css",
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`,
        },
        {
          path: "styles/components.css",
          content: `.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}`,
        },

        // Tests directory
        {
          path: "tests/Button.test.tsx",
          content: `import { render, screen } from '@testing-library/react'
import { Button } from '../components/Button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})`,
        },
        {
          path: "tests/Input.test.tsx",
          content: `import { render, screen } from '@testing-library/react'
import { Input } from '../components/Input'

test('renders input with placeholder', () => {
  render(<Input placeholder="Enter text" />)
  expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
})`,
        },

        // Tests/utils subdirectory
        {
          path: "tests/utils/helpers.test.ts",
          content: `import { formatDate, capitalize } from '../../utils/helpers'

test('formatDate formats date correctly', () => {
  const date = new Date('2024-01-01')
  expect(formatDate(date)).toBe('1/1/2024')
})

test('capitalize capitalizes first letter', () => {
  expect(capitalize('hello')).toBe('Hello')
})`,
        },

        // Assets directory
        {
          path: "assets/images/logo.png",
          content: "fake-png-data",
        },
        {
          path: "assets/images/hero.jpg",
          content: "fake-jpg-data",
        },
        {
          path: "assets/icons/arrow.svg",
          content: "<svg>...</svg>",
        },

        // Docs directory
        {
          path: "docs/README.md",
          content: `# My Project

This is a comprehensive project structure for testing the enhanced file selector.

## Features
- Nested folder structure
- Multiple file types
- Organized by functionality`,
        },
        {
          path: "docs/API.md",
          content: `# API Documentation

## Endpoints
- GET /users
- POST /users
- GET /posts`,
        },

        // Config directory
        {
          path: "config/database.ts",
          content: `export const databaseConfig = {
  host: 'localhost',
  port: 5432,
  name: 'myapp'
}`,
        },
        {
          path: "config/redis.ts",
          content: `export const redisConfig = {
  host: 'localhost',
  port: 6379
}`,
        },
      ]

      // Create all files
      for (const file of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>Enhanced File Selector Test</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <>
      <RunFrameWithApi
        debug
        showFilesSwitch={true}
        useEnhancedFileSelector={true}
      />
      <DebugEventsTable />
    </>
  )
}
