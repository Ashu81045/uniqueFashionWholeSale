import { useState, type FormEvent } from 'react'
import { AlertCircle } from 'lucide-react'
import { signIn } from '../../../firebase/auth'
import { useT } from '../../../i18n/I18nContext'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Spinner } from '../../../components/ui/Spinner'

export function LoginForm() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      console.log('Attempting sign in with email:', email)
      const credential = await signIn(email, password)
      console.log('Firebase signIn successful:', credential.user.uid, credential.user.email)
    } catch (err: unknown) {
      console.error('Firebase signIn failed:', err)
      setError(t('auth.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Input
        id="email"
        type="email"
        label={t('auth.email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        required
      />
      <Input
        id="password"
        type="password"
        label={t('auth.password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && (
        <div className="flex animate-fade-in items-center gap-2 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? <Spinner tone="dark" /> : t('auth.loginButton')}
      </Button>
    </form>
  )
}
