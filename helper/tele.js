import { TelegramClient, sessions } from "telegram";
import "dotenv/config";
export const getClientTele = async (app_id, app_hash, session, proxy_url) => {
  try {
    if (session == "" || proxy_url == "") {
      return false;
    }
    const string_session = new sessions.StringSession(session);
    const options = {
      autoReconnect: false,
    };
    if (proxy_url) {
      const [user_pass, ip_port] = proxy_url
        .replace("socks5://", "")
        .split("@");
      const [username, password] = user_pass.split(":");
      const [ip, port] = ip_port.split(":");
      const proxy = {
        socksType: 5,
        ip: ip,
        port: parseInt(port),
        username: username,
        password: password,
        timeout: "10000",
      };
      options["proxy"] = proxy;
    }
    const client = new TelegramClient(
      string_session,
      parseInt(app_id),
      app_hash,
      options
    );
    return client;
  } catch (e) {
    return false;
  }
};
export const getIframeUrl = async (app_id, app_hash, session, proxy_url) => {
  try {
    if (session == "" || proxy_url == "") {
      return false;
    }
    const string_session = new sessions.StringSession(session);
    const options = {
      autoReconnect: false,
      timeout: 10000,
    };
    if (proxy_url) {
      const [user_pass, ip_port] = proxy_url
        .replace("socks5://", "")
        .split("@");
      const [username, password] = user_pass.split(":");
      const [ip, port] = ip_port.split(":");
      const proxy = {
        socksType: 5,
        ip: ip,
        port: parseInt(port),
        username: username,
        password: password,
        timeout: "10000",
      };
      options["proxy"] = proxy;
    }
    const client = new TelegramClient(
      string_session,
      parseInt(app_id),
      app_hash,
      options
    );
    client.setLogLevel("none");
    await client.start();
    if (!(await client.checkAuthorization())) return;
    const response = await client.invoke(
      new Api.messages.RequestWebView({
        peer: process.env.BOT_NAME,
        bot: process.env.BOT_NAME,
        platform: "ios",
        url: process.env.BOT_URL,
      })
    );
    await client.disconnect();
    if (response && response.url) return response.url;
    return client;
  } catch (e) {
    return false;
  }
};
