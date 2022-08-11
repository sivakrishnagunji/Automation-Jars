validateClientId = function validateClientId() { // eslint-disable-line no-undef	
	var clientID = context.getVariable("request.header.clientId");
	var aceesClientIDDeveloper = context.getVariable("oauthv2accesstoken.GOA2-GetOauthAccessTokenID.client_id");
	var refreshClientIDDeveloper = context.getVariable("oauthv2refreshtoken.GOA2-GetOauthRefreshTokenID.client_id");
	var tokenClientID;
	var customizedErrorMessage = {};

	if (aceesClientIDDeveloper){
		tokenClientID = aceesClientIDDeveloper;
	}
	if (refreshClientIDDeveloper){
		tokenClientID = refreshClientIDDeveloper;
	}

	if (tokenClientID !== clientID){
		customizedErrorMessage = {
			"statusCode": "401",
			"reasonPhrase": "Unauthorized",
			"errorCode": "invalid_request",
			"errorDescription": "Not authorized to revoke given token"
		};
		context.setVariable("errorJSON", "customizedErrorMessage");
		context.setVariable("customizedErrorMessage", JSON.stringify(customizedErrorMessage));
		throw "exception";
	}
};