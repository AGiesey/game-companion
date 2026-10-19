import { Route, Routes } from 'react-router'
import { CreateAccountPage } from './account/CreateAccountPage.tsx'
import { ForgotPasswordPage } from './account/ForgotPasswordPage.tsx'
import { RequireSession } from './account/RequireSession.tsx'
import { RequireSignedOut } from './account/RequireSignedOut.tsx'
import { ResetPasswordPage } from './account/ResetPasswordPage.tsx'
import { useRecheckSessionOnRestore } from './account/useSession.ts'
import { SignInPage } from './account/SignInPage.tsx'
import { HomePage } from './home/HomePage.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { ThemePreview } from './preview/ThemePreview.tsx'

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
          <Route path="/" element={<HomePage />} />
        </Route>
        {/* import.meta.env.DEV is false in production builds, so the preview is left out of them. */}
        {import.meta.env.DEV && <Route path="/preview" element={<ThemePreview />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}

export default App
