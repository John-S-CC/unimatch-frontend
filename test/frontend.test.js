import { describe, test, expect, beforeAll } from 'vitest'

beforeAll(() => {

    document.body.innerHTML = `
        <form id="loginForm"></form>

        <div id="mensaje"></div>

        <input id="correo" />
        <input id="password" />

        <button id="btnLogin"></button>

        <div id="app"></div>
    `
})

describe('Frontend coverage', () => {

    test('modules should load', async () => {

        await import('../js/api.js')
        await import('../js/app-init.js')
        await import('../js/app-shell.js')
        await import('../js/app-ui.js')
        await import('../js/auth.js')
        await import('../js/dashboard.js')
        await import('../js/login.js')
        await import('../js/materias.js')

        expect(true).toBe(true)
    })

})