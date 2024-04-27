const { traffic, R2 } = require("cloudflare-r2.js");
const fs = require("fs");
const path = require("path");
  /**
   * Building the R2 client Instance with the credentials you got from the Cloudflare R2 dashboard
   */
const R2Object = new R2()
  .setSecret("f3822851f35a3279f88b71e4d1d4db4629195cb7ce766c1367d89d7470950f69") // Your Cloudflare-R2 Secret Key
  .setAccessKey("e3b3c5995cd6531f2c1a305ee1cadaf3") // Your Cloudflare-R2 Access Key
  .setId("56b06f3273b7d3101fc6cd7b17e14584") // Your Cloudflare-R2 ID
  .build(); // Building the client in the end
console.log(R2Object);

const x = new traffic()
.bucketName("ju-community") // Your Cloudflare-R2 Bucket Name where you want to upload the image
.upload(["static\\images\\Instagram-Post-Ideas.png"]) // Your image path (Must use an array)
.then((res)=>console.log(res))

const Objs = new traffic()
.getFiles("ju-community")
.then((x) => {
    console.log(x);
  });