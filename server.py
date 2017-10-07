# -*- coding: utf-8 -*-

import os

import plivoxml
from flask import Flask, Response, request, url_for

# This is the message that Plivo reads when the caller does nothing at all
NO_INPUT_MESSAGE = "Sorry, I didn't catch that. Please hangup and try again later."

PHONE_NUMBER = '1234567890'
PASSCODE = '4293'

speed_dial = {
    '1': {
        'name': 'Manraj Singh',
        'number': '+919811040427'
    },
    '2': {
        'name': 'Papa',
        'number': '+919414071598',
    },
    '3': {
        'name': 'Last Dialed',
        'number': '+919624040633',
    },
    '4': {
        'name': 'Anurag Agarwal',
        'number': '+917405352413',
    },
    '*': {
        'name': 'Last Dialed',
        'number': '+919624040633',
    },
}

app = Flask(__name__)


@app.route('/', methods=['GET'])
def index():
    response = plivoxml.Response()
    response.addSpeak(body='Enter your 10 digit mobile number after beep')

    absolute_action_url = url_for('passcode', _external=True)
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=10, numDigits=10, retries=1, playBeep=True,
                                   validDigits='1234567890')
    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


def exit_sequence(msg='We did not receive a valid response. We will hangup now.'):
    response = plivoxml.Response()
    response.addSpeak(msg)
    response.addHangup()
    return Response(str(response), mimetype='text/xml')


@app.route('/passcode', methods=['POST'])
def passcode():
    post_args = request.form

    response = plivoxml.Response()
    phone_number = post_args.get('Digits')
    response.addSpeak(body='Enter your 4 digit TOTP pin after beep')
    absolute_action_url = url_for('authenticate', _external=True, phone_number=str(phone_number))
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=4, numDigits=4, retries=1, playBeep=True,
                                   validDigits='1234567890')

    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


@app.route('/authenticate', methods=['POST'])
def authenticate():
    phone_number = request.args.get('phone_number')
    passcode = request.form.get('Digits')

    if phone_number != PHONE_NUMBER or passcode != PASSCODE:
        return exit_sequence('Authentication failed')

    response = plivoxml.Response()
    response.addSpeak(body='Use keys 1-9 for speed dial. Press * for last dialed number.')
    absolute_action_url = url_for('main_menu', _external=True, phone_number=str(phone_number))
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=5, numDigits=1, retries=3, validDigits='123456789*')

    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


@app.route('/main_menu', methods=['POST'])
def main_menu():
    phone_number = request.args.get('phone_number')
    option = request.form.get('Digits')

    to_call = speed_dial.get(option, None)

    if to_call is None:
        return exit_sequence()

    response = plivoxml.Response()
    response.addSpeak('Connecting %s' % to_call['name'])
    params = {'callerId': phone_number}
    d = response.addDial(**params)
    d.addNumber(to_call['number'])

    return Response(str(response), mimetype='text/xml')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
