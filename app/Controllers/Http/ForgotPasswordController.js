'use strict'

const crypto = require('crypto');
const moment = require('moment');

const User = use('App/Models/User')
const Mail = use('Mail')

class ForgotPasswordController {
  async store ({ request, response }) {
    try {
      const email = request.input('email')

      const user = await User.findByOrFail('email', email)

      user.token = crypto.randomBytes(10).toString('hex')
      user.token_created_at = new Date()

      await user.save()

      //Send mail for create new password
      await Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`
        },
          message => {
          message
            .to(user.email)
            .from('learnsomething@gmail.com', 'Mateus | Learn Something')
            .subject('Recuperação de senha')
        }
      )

    } catch(err) {
      return response
        .status(err.status)
        .send({ error: { message: 'Ops, algo não deu certo, esse email existe?' } })
    }
  }

  async update ({ request, response }) {
    try {
      const { token, password } = request.all()

      const user = await User.findByOrFail('token', token)

      const tokenExpired = moment()
        .subtract('2', 'days')
        .isAfter(user.token_created_at)

        if (tokenExpired) {
          return response
            .status(401)
            .send({ error: { message: 'O token de expiração está vencido.. Sorry :(' } })
        }

        user.token = null
        user.token_created_at = null
        user.password = password

        await user.save()
    } catch (err) {
      return response
        .status(err.status)
        .send({ error: { message: 'Ops, algum problema ocorreu ao resetar sua senha' } })
    }
  }
}

module.exports = ForgotPasswordController
