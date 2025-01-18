import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { HttpsProxyAgent } from "https-proxy-agent";
import colors from "colors";
import { DateTime } from "luxon";
import { getClientTele, getIframeUrl } from "./helper/tele.js";
import { ethers } from "ethers";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class Account {
  constructor(
    accountIndex,
    address_evm,
    private_key,
    uid,
    address_bitget,
    proxy
  ) {
    this.accountIndex = accountIndex;
    this.address_evm = address_evm;
    this.private_key = private_key;
    this.uid = uid;
    this.address_bitget = address_bitget;
    let [ip, port, user, password] = proxy.split(":");
    this.proxy = `http://${user}:${password}@${ip}:${port}`;
    this.request = axios.create();
    this.headers = {
      "accept-language": "en-US,en;q=0.9",
      origin: "https://preclaim.plumenetwork.xyz",
      "Content-Type": "application/json",
      referer: "https://preclaim.plumenetwork.xyz",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    };
  }
  async random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  async log(msg, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const accountPrefix = `[${timestamp}][Tài khoản ${this.accountIndex + 1}]`;
    let logMessage = "";

    switch (type) {
      case "success":
        logMessage = `${accountPrefix} ${msg}`.green;
        break;
      case "error":
        logMessage = `${accountPrefix} ${msg}`.red;
        break;
      case "warning":
        logMessage = `${accountPrefix} ${msg}`.yellow;
        break;
      default:
        logMessage = `${accountPrefix} ${msg}`.blue;
    }

    console.log(logMessage);
  }
  async http(url, headers, data = null, proxy = null) {
    try {
      if (!data) {
        const response = await this.request.get(url, {
          headers: { ...this.headers, headers },
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(proxy),
        });
        return response;
      } else {
        const response = await axios.request({
          method: "POST",
          url: url,
          data,
          headers: { ...this.headers, headers },
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(proxy),
        });
        return response;
      }
    } catch (error) {
      console.error(error.response);
      throw error;
    }
  }
  async PreRegister() {
    try {
      const response_reg = await axios.get(
        `https://registration.plumenetwork.xyz/api/sign-read?address=${this.address_evm}`,
        {
          headers: this.headers,
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(this.proxy),
        }
      );
      if (response_reg.status === 200) {
        this.log(`PreRegister ${response_reg.data?.registered}`, "success");
        return true;
      }
    } catch (error) {
      if (error.response) {
        this.log(`Catch: ${error.response}`, "error");
      } else {
        this.log(`Catch: ${error.message}`, "error");
      }
      return false;
    }
  }
  async PreClaimRegister() {
    try {
      const sign = await this.Sign();
      const payload = {
        message:
          "By signing this message, I confirm that I have read and agreed to Plume's Airdrop Terms of Service. This does not cost any gas to sign.",
        signature: sign,
        address: this.address_evm,
        twitterEncryptedUsername: null,
        twitterEncryptedId: null,
        discordEncryptedUsername: null,
        discordEncryptedId: null,
      };
      const response = await axios.post(
        `https://registration.plumenetwork.xyz/api/sign-write`,
        payload,
        {
          headers: this.headers,
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(this.proxy),
        }
      );
      if (response.status === 200) {
        this.log(
          `PreClaimRegister ${JSON.stringify(response.data)}`,
          "success"
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if (error.response) {
        this.log(`Catch: ${error.response}`, "error");
      } else {
        this.log(`Catch: ${error.message}`, "error");
      }
      return false;
    }
  }
  async register() {
    try {
      const response = await axios.get(
        `https://preclaim.plumenetwork.xyz/api/sign-read?address=${this.address_evm}`,
        {
          headers: this.headers,
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(this.proxy),
        }
      );
      if (response.status === 200) {
        this.log(`Register ${response.data?.registered}`, "success");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if (error.response) {
        this.log(`Catch: ${error.response}`, "error");
      } else {
        this.log(`Catch: ${error.message}`, "error");
      }
      return false;
    }
  }
  async Sign() {
    try {
      const wallet = new ethers.Wallet(this.private_key);
      const data_sign =
        "By signing this message, I confirm that I have read and agreed to Plume's Airdrop Terms of Service. This does not cost any gas to sign.";
      const signature = await wallet.signMessage(data_sign);
      this.log(`Sign: ${signature}`, "success");
      return signature;
    } catch (error) {
      this.log(`Catch: ${error.message}`, "error");
    }
  }
  async SubmitBitget() {
    try {
      const signature = await this.Sign();
      let payload = {
        message:
          "By signing this message, I confirm that I have read and agreed to Plume's Airdrop Terms of Service. This does not cost any gas to sign.",
        signature: signature,
        address: this.address_evm,
        cex: "BITGET",
        cexId: this.uid,
        cexAddress: this.address_bitget,
      };
      const response = await axios.post(
        "https://preclaim.plumenetwork.xyz/api/sign-write",
        payload,
        {
          headers: this.headers,
          timeout: 10000,
          httpAgent: new HttpsProxyAgent(this.proxy),
        }
      );
      if (response.status === 200) {
        this.log(`${JSON.stringify(response.data)}`, "success");
      }
      //this.log(`${JSON.stringify(payload)}`, "success");
    } catch (error) {
      this.log(`Catch: ${JSON.stringify(error.response)}`, "error");
      return false;
    }
  }
  async processAccount() {
    try {
      if (await this.PreRegister()) {
        await this.PreClaimRegister();
      }
      const is_resgister = await this.register();
      if (!is_resgister) {
        this.log("RegisterFail", "warning");
        return;
      }
      await this.SubmitBitget();
    } catch (error) {}
  }
}

async function main() {
  const dataFile = path.join(__dirname, "data.txt");
  const data = fs
    .readFileSync(dataFile, "utf8")
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);
  const configFile = path.join(__dirname, "config.json");
  const config = fs.existsSync(configFile)
    ? JSON.parse(fs.readFileSync(configFile, "utf8"))
    : { maxThreads: 5 };
  const maxThreads = config.maxThreads || 5;
  while (true) {
    for (let i = 0; i < data.length; i += maxThreads) {
      const batch = data.slice(i, i + maxThreads);

      const promises = batch.map((data_account, indexInBatch) => {
        const accountIndex = i + indexInBatch;
        const data_account_array = data_account.split("|");
        const address_evm = data_account_array[0];
        const private_key = data_account_array[1];
        const uid = data_account_array[2];
        const address_bitget = data_account_array[3];
        const proxy = data_account_array[4];
        const client = new Account(
          accountIndex,
          address_evm,
          private_key,
          uid,
          address_bitget,
          proxy
        );
        return timeout(client.processAccount(), 10 * 60 * 1000).catch((err) => {
          client.log(`Lỗi xử lý tài khoản: ${err.message}`, "error");
        });
      });

      await Promise.allSettled(promises);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    console.log(`Hoàn thành tất cả tài khoản, chờ 24 giờ để tiếp tục`);
    await new Promise((resolve) => setTimeout(resolve, 86400 * 1000));
  }
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
