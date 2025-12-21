# Frontend - Ghani Grammar School System

Next.js 14-based frontend with TypeScript, Tailwind CSS, and complete Supabase integration.

---

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

**Server:** http://localhost:3000

---

## 📁 **Project Structure**

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── admin/             # Admin portal (13 pages)
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── finance/
│   │   ├── stationery/
│   │   ├── announcements/
│   │   ├── papers/
│   │   ├── events/
│   │   ├── reports/
│   │   └── settings/
│   ├── principal/         # Principal portal
│   ├── teacher/           # Teacher portal
│   ├── student/           # Student portal
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx
│   ├── students/         # Student components
│   │   └── StudentForm.tsx
│   ├── teachers/         # Teacher components
│   │   └── TeacherForm.tsx
│   ├── classes/          # Class components
│   │   ├── ClassForm.tsx
│   │   └── StudentEnrollment.tsx
│   ├── attendance/       # Attendance components
│   │   ├── AttendanceForm.tsx
│   │   └── BulkAttendanceForm.tsx
│   ├── finance/          # Finance components
│   ├── announcements/    # Announcement components
│   ├── ui/               # UI components (Shadcn)
│   ├── providers.tsx     # App providers
│   ├── AuthGate.tsx      # Route protection
│   └── SessionManager.tsx # Session management
│
├── services/             # API services
│   ├── authService.ts
│   ├── studentService.ts
│   ├── teacherService.ts
│   ├── classService.ts
│   ├── gradeService.ts
│   ├── attendanceService.ts
│   ├── financeService.ts
│   ├── paperService.ts
│   └── eventService.ts
│
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
│
├── store/                # Zustand stores
│   └── authStore.ts      # Auth state management
│
├── lib/                  # Utilities
│   ├── api.ts            # Axios instance
│   ├── supabase.ts       # Supabase client
│   ├── utils.ts          # Helper functions
│   └── gradingUtils.ts   # Grading calculations
│
├── types/                # TypeScript types
│   └── index.ts          # All type definitions
│
├── middleware.ts         # Next.js middleware
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── next.config.js        # Next.js config
└── .env.local.example    # Environment template
```

---

## 🔌 **Services (API Integration)**

All services connect to backend API and Supabase:

### **authService.ts**
```typescript
- login(email, password)
- logout()
- getCurrentUser()
- changePassword()
```

### **studentService.ts**
```typescript
- getStudents(params)
- getStudent(id)
- createStudent(data)
- updateStudent(id, data)
- deleteStudent(id)
```

### **teacherService.ts**
```typescript
- getTeachers(params)
- getTeacher(id)
- createTeacher(data)
- updateTeacher(id, data)
- deleteTeacher(id)
```

### **gradeService.ts**
```typescript
- getGrades(params)
- createGrade(data)
- createBulkGrades(grades)
- updateGrade(id, data)
- deleteGrade(id)
```

### **eventService.ts** (NEW)
```typescript
- getEvents(params)
- createEvent(data)
- updateEvent(id, data)
- deleteEvent(id)
- getEventStats()
```

... and more (8 services total)

---

## 🎨 **UI Components**

### **Shadcn/ui Components Used:**
- Button
- Card
- Input
- Label
- Select
- Textarea
- Badge
- Dialog
- Tabs
- Table

### **Custom Components:**
- DashboardLayout - Main layout wrapper
- Sidebar - Navigation sidebar
- AuthGate - Route protection
- SessionManager - Session handling
- Form components for each module

---

## 🔐 **Authentication Flow**

### **1. Login Process:**
```typescript
User enters credentials
  ↓
authService.login(email, password)
  ↓
Backend validates with Supabase
  ↓
Returns JWT token
  ↓
Store in localStorage + cookie
  ↓
Redirect to dashboard
```

### **2. Protected Routes:**
```typescript
AuthGate checks authentication
  ↓
If not authenticated → redirect to /login
  ↓
If authenticated but wrong role → redirect to appropriate dashboard
  ↓
Allow access to page
```

### **3. API Requests:**
```typescript
All requests include Authorization header
  ↓
axios interceptor adds: Authorization: Bearer {token}
  ↓
Backend validates token
  ↓
Returns data or 401 error
```

---

## 📊 **State Management**

### **Zustand Store (authStore.ts):**
- User data
- Authentication status
- Token management
- Login/logout actions

### **React Query:**
- Data fetching
- Caching
- Mutations
- Automatic refetch

### **React Context (AuthContext.tsx):**
- Global auth state
- Session management
- User data access

---

## 🎯 **Key Features**

### **All Pages Use Real Database:**
- ✅ No mock data
- ✅ Real-time updates
- ✅ Proper error handling
- ✅ Loading states
- ✅ Form validation

### **Professional UI/UX:**
- ✅ Responsive design
- ✅ Clean interface
- ✅ Intuitive navigation
- ✅ Consistent styling
- ✅ Accessibility support

### **Performance:**
- ✅ React Query caching
- ✅ Code splitting
- ✅ Optimized builds
- ✅ Fast page loads

---

## 🧪 **Development**

### **Start Development Server:**
```bash
npm run dev
```

### **Build for Production:**
```bash
npm run build
npm start
```

### **Lint Code:**
```bash
npm run lint
```

---

## 📦 **Key Dependencies**

```json
{
  "next": "^14.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "axios": "^1.x",
  "@supabase/supabase-js": "^2.x"
}
```

---

## 🚀 **Deployment**

See `../DEPLOYMENT.md` for production deployment to Vercel.

**Environment Variables for Production:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📚 **Resources**

- Next.js Docs: https://nextjs.org/docs
- React Query Docs: https://tanstack.com/query
- Tailwind CSS: https://tailwindcss.com/docs
- Shadcn/ui: https://ui.shadcn.com

---

**Frontend is production-ready!** ✅
