
import axios from "axios";

async function testSSI() {
  try {
    const symbols = "FPT,VIC,VNM,HPG";
    const response = await axios.get(`https://iboardquery.ssi.com.vn/stock/v2/stock?symbols=${symbols}`, {
      headers: {
        'Referer': 'https://iboard.ssi.com.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("SSI Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testSSI();
