import { themes } from '../theme/themes.ts'
import { useTheme } from '../theme/useTheme.ts'

// Native radios: arrow keys move between themes and screen readers announce the checked one.
export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme()

  return (
    <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <legend className="label-caps mb-2 text-text-faint">Theme</legend>
      {themes.map((theme) => (
        <label key={theme.id} className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="theme"
            value={theme.id}
            checked={themeId === theme.id}
            onChange={() => setThemeId(theme.id)}
            className="size-4 accent-accent"
          />
          {theme.name}
        </label>
      ))}
    </fieldset>
  )
}
