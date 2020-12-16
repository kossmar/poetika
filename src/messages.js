

function emailResetConfirmationMsg(email) {
    return `An reset link has been sent to ${email}`
}

function emailResetGenericErrorMsg(err) {
    return `An unexpected error has occurred ${err}`
}

module.exports = {
    emailReset_wrongEmailMsg: "This email is not registered",
    emailReset_ConfirmationMsg: emailResetConfirmationMsg,
    emailReset_GenericErrorMsg: emailResetGenericErrorMsg
}
