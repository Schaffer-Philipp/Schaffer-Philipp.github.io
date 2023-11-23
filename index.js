import express from "express";
import axios from "axios";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from 'path';

// const APP_ID = config.APP_ID;
// const APP_SECRET = credentials.APP_SECRET;
// const PUBLIC_KEY = config.PUBLIC_KEY;
// const AUTH_PROVIDER_BASE_URL = 'https://www.wixapis.com/oauth';
const __dirname = path.resolve();
const appId = "3d863194-17f7-496d-8882-f18e533ae6d3";
const appSecret = "9fbaa472-b389-4afb-bc76-6d937789a6ca";
let authCode = 0;
let data_siteID = 0;
let accessToken = 0;
let refreshToken = 0;
const app = express();
const PORT = 3000;
let siteID = "";

app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  const token = req.query.token;
  const appId = "3d863194-17f7-496d-8882-f18e533ae6d3"; // Replace with your app ID from the Wix Developers Center
  const redirectUrl = "http://localhost:3000/callback"; // Replace with one of your redirect URLs from the Wix Developers Center
  const state = ""; // Optional, you can add a unique string to identify users

  const url = `https://www.wix.com/installer/install?token=${token}&appId=${appId}&redirectUrl=${redirectUrl}&state=${state}`;

  res.redirect(url);
});

  app.get('/callback', (req, res) => {
  authCode = req.query.code;
	const state = req.query.state;
	const instanceId = req.query.instanceId;
	console.log(authCode);
	console.log(state);
	console.log(instanceId);

	res.redirect('/integrate');
  });



app.get("/integration", (req, res) => {
	authCode = req.query.code;

	const filePath = path.join(__dirname, '/integration.html');
	res.sendFile(filePath);
});

app.post("/integration-submit", (req, res) => {
  authCode = req.query.code;
	data_siteID = req.body.siteId;
	console.log("data_siteID: "+data_siteID)
	res.redirect("http://localhost:3000/callback");
});

app.get("/dashboard", (req, res) => {

	const filePath = path.join(__dirname, '/dashboard.html');
	res.sendFile(filePath);
});

app.post("/new-access", async (req, res) => {
  data_siteID = req.body.siteId;
  const requestBody = {
    grant_type: "refresh_token",
    client_id: appId,
    client_secret: appSecret,
    refresh_token: refreshToken,
  };

  try {
    const response = await axios.post(
      "https://www.wixapis.com/oauth/access",
      requestBody
    );

    refreshToken = response.data.refresh_token;
    accessToken = response.data.access_token;

    console.log(response);

    console.log(
      "-------------------------script post update---------------------------"
    );
    const url = "https://www.wixapis.com/apps/v1/scripts";
  
  
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer "+ accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          parameters: {
            KeyName123: data_siteID
          },
        },
      }),
    }).then((responseScript) => console.log(responseScript));
  
    console.log(
      "-------------------------script post update---------------------------"
    );

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
  
});





app.get("/integrate", async (req, res) => {
  console.log(authCode);

  const requestBody = {
    grant_type: "authorization_code",
    client_id: appId,
    client_secret: appSecret,
    code: authCode,
  };

  try {
    const response = await axios.post(
      "https://www.wixapis.com/oauth/access",
      requestBody
    );
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    console.log("access token: ", accessToken);
    console.log("refresh token: ", refreshToken);

    const response2 = await axios.get(
      "https://www.wixapis.com/apps/v1/instance",
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    siteID = response2.data.site.siteId;

    console.log("siteId: ", siteID);

    console.log(
      "-------------------------script post---------------------------"
    );

    const url = "https://www.wixapis.com/apps/v1/scripts";


    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer "+accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          parameters: {
            KeyName123: ""
          },
        },
      }),
    }).then((responseScript) => console.log(responseScript));

    console.log(
      "-------------------------script post---------------------------"
    );

    console.log("performing now bi-event...");

    const response3 = await fetch("https://www.wixapis.com/apps/v1/bi-event", {
      method: "POST",
      headers: {
        Authorization: accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventName: "APP_FINISHED_CONFIGURATION" }),
    });
    console.log(response3);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
//   res.redirect("https://manage.wix.com/dashboard/" + siteID+"/app/"+appId+"?referralInfo=sidebar");

  res.redirect("https://manage.wix.com/dashboard/" + siteID+"/app/"+appId+"?referralInfo=sidebar");
});

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});


