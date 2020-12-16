

function passwordResetLinkConfirmationMsg(email) {
    return `A reset link has been sent to ${email}`
}

function passwordResetResetConfirmationMsg(email) {
    return `You password has successfully been reset. A confirmation e-mail has been sent to ${email}`
}


function passwordResetGenericErrorMsg(err) {
    return `An unexpected error has occurred: ${err}`
}

function passwordResetResetErrorMsg(err) {
    return `An unexpected error has occurred: ${err}\n If the error persists, request a new reset link`
}

module.exports = {
    // Confirmation
    passwordResetLinkConfirmationMsg,
    passwordResetResetConfirmationMsg,

    // Error
    passwordReset_WrongEmailMsg: "This email is not registered",
    passwordReset_InvalidToken: "Your reset link is invalid or has expired. Please try again",
    passwordReset_LinkEmailErrorMsg: "We were unable to send a reset link. Please try again. If the problem persists, please contact us.",
    passwordResetGenericErrorMsg,
    passwordResetResetErrorMsg
}
