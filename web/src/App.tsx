import { Route, Routes } from 'react-router'
import { CreateAccountPage } from './account/CreateAccountPage.tsx'
import { ForgotPasswordPage } from './account/ForgotPasswordPage.tsx'
import { RequireSession } from './account/RequireSession.tsx'
import { RequireSignedOut } from './account/RequireSignedOut.tsx'
import { ResetPasswordPage } from './account/ResetPasswordPage.tsx'
import { useRecheckSessionOnRestore } from './account/useSession.ts'
import { SignInPage } from './account/SignInPage.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { ThemePreview } from './preview/ThemePreview.tsx'
import { LandingPage } from './runs/LandingPage.tsx'
import { NewRunPage } from './runs/NewRunPage.tsx'
import { RunListPage } from './runs/RunListPage.tsx'
import { RunPage } from './runs/RunPage.tsx'

function App() {
  useRecheckSessionOnRestore()

  return (
    <main>
      <Routes>
        <Route element={<RequireSignedOut />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireSession />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/runs" element={<RunListPage />} />
          <Route path="/runs/new" element={<NewRunPage />} />
          <Route path="/runs/:runId" element={<RunPage />} />
        </Route>
        {/* import.meta.env.DEV is false in production builds, so the preview is left out of them. */}
        {import.meta.env.DEV && <Route path="/preview" element={<ThemePreview />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}

export default App
