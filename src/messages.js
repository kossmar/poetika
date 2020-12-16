

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
    // Success
    passwordResetLinkConfirmationMsg,
    passwordResetResetConfirmationMsg,

    // Error
    passwordReset_WrongEmailMsg: "This email is not registered",
    passwordReset_InvalidToken: "Your reset link is invalid or has expired. Please try again",
    passwordResetGenericErrorMsg,
    passwordResetResetErrorMsg
}
