import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/Button.tsx'
import { buttonClasses } from '../components/buttonClasses.ts'
import { FormError } from '../components/FormError.tsx'
import { TextField } from '../components/TextField.tsx'
import type { FieldErrors } from '../forms/fieldErrors.ts'
import { fieldErrorsFrom } from '../forms/formErrors.ts'
import { firstErrorTarget, useFocusOnError } from '../forms/useFocusOnError.ts'
import { games, gameThemeId } from '../games/games.ts'
import { useRunTheme } from '../theme/useThemeSources.ts'
import { useCreateRun } from './runQueries.ts'
import { maximumRunNameLength, validateNewRun, type NewRunField } from './validation.ts'

const fields = ['name', 'gameId'] as const satisfies readonly NewRunField[]

export function NewRunPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<NewRunField>>({})
  const [formError, setFormError] = useState<string>()
  const { register, focus } = useFocusOnError<NewRunField | 'form'>()
  const gameErrorId = useId()
  const createRun = useCreateRun()

  // Picking a game shows its look straight away; leaving this screen any way returns to the default theme.
  useRunTheme(gameId ? gameThemeId(gameId) : null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateNewRun({ name, gameId })
    setFieldErrors(errors)
    setFormError(undefined)
    // validateNewRun already rejects a missing game; the !gameId is for TypeScript, which can't see that.
    if (Object.keys(errors).length > 0 || !gameId) {
      focus(firstErrorTarget(fields, errors))
      return
    }
    createRun.mutate(
      { name: name.trim(), gameId, themeId: gameThemeId(gameId) },
      {
        // Replace, so Back from the new run goes to the run list rather than this form.
        onSuccess: (run) => void navigate(`/runs/${run.id}`, { replace: true }),
        onError: (error) => {
          const mapped = fieldErrorsFrom(error, fields)
          setFieldErrors(mapped.fieldErrors)
          setFormError(mapped.formError)
          focus(firstErrorTarget(fields, mapped.fieldErrors))
        },
      },
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 px-4 py-8">
      <title>New run · Game Companion</title>
      <h1 className="font-display text-3xl font-semibold text-text-strong">New run</h1>

      <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {formError && <FormError ref={register('form')} message={formError} />}

        <TextField
          ref={register('name')}
          label="Name"
          autoComplete="off"
          maxLength={maximumRunNameLength}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />

        <fieldset
          aria-invalid={fieldErrors.gameId ? true : undefined}
          aria-describedby={fieldErrors.gameId ? gameErrorId : undefined}
          className="flex flex-col gap-2"
        >
          <legend className="label-caps mb-2 text-text-muted">Game</legend>
          {games.map((game, index) => (
            <label
              key={game.id}
              className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 has-checked:border-border-accent"
            >
              <input
                // Focus lands on the first option when the group has an error.
                ref={index === 0 ? register('gameId') : undefined}
                type="radio"
                name="game"
                value={game.id}
                checked={gameId === game.id}
                onChange={() => setGameId(game.id)}
                className="size-5 accent-accent"
              />
              <span className="font-display text-xl text-text-strong">{game.name}</span>
            </label>
          ))}
          {fieldErrors.gameId && (
            <p id={gameErrorId} className="text-label text-accent-bright">
              {fieldErrors.gameId}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" disabled={createRun.isPending}>
            {createRun.isPending ? 'Starting run…' : 'Start run'}
          </Button>
          <Link to="/runs" className={`text-center ${buttonClasses('secondary')}`}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
