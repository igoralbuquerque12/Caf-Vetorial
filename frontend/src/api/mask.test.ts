import { describe, expect, it } from 'vitest'
import { maskAuthorization, maskBody, maskHeaders, maskJson, maskToken, PASSWORD_MASK } from './mask'

describe('mask', () => {
  it('mascara a senha por completo', () => {
    expect(maskJson({ email: 'a@b.com', password: 'segredo123' })).toEqual({ email: 'a@b.com', password: PASSWORD_MASK })
    expect(PASSWORD_MASK).toBe('••••••••')
  })

  it('mostra só os 12 primeiros caracteres dos tokens', () => {
    const token = 'abcdefghijklmnopqrstuvwxyz'
    expect(maskToken(token)).toBe('abcdefghijkl…')
    expect(maskJson({ accessToken: token, refreshToken: token, tokenType: 'Bearer' })).toEqual({
      accessToken: 'abcdefghijkl…',
      refreshToken: 'abcdefghijkl…',
      tokenType: 'Bearer',
    })
  })

  it('mascara o header Authorization sem diferenciar maiúsculas', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.payload.signature'
    expect(maskAuthorization(`Bearer ${jwt}`)).toBe('Bearer eyJhbGciOiJI…')
    expect(maskHeaders({ authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' })).toEqual({
      authorization: 'Bearer eyJhbGciOiJI…',
      'Content-Type': 'application/json',
    })
  })

  it('mascara campos aninhados e corpos em texto JSON', () => {
    expect(maskBody('{"user":{"password":"x"},"list":[{"refreshToken":"123456789012345"}]}')).toEqual({
      user: { password: PASSWORD_MASK },
      list: [{ refreshToken: '123456789012…' }],
    })
  })

  it('devolve texto que não é JSON sem alterar', () => {
    expect(maskBody('não é json')).toBe('não é json')
  })
})
