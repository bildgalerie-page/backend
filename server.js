import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import express from "express";
import axios from "axios";
// import { json } from "body/parser";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const app = express();
app.use(cors());
app.use(express.json());
const { parsed: config } = dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "DEV",
    resource_type: "auto",
  },
});
const upload = multer({ storage });

app.get("/", function (req, res) {
  res.json({ msg: "up and running" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  console.log("/upload called");
  console.log(req.file);
  console.log(req.body);
  return res.json({ image: req.file.path });
});

app.delete("/delete", async (req, res) => {
  try {
    console.log("/delete called");
    const { public_id } = req.body;
    if (!public_id) {
      throw new Error("no public id provided");
    }
    const response = await cloudinary.uploader.destroy(public_id);
    console.log(response);
    if (response.result === "ok") {
      return res.json({ message: "deleted" });
    } else {
      return res.status(404).json({ message: "not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

const BASE_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}`;

const auth = {
  username: process.env.API_KEY,
  password: process.env.API_SECRET,
};

app.get("/photos", async (req, res) => {
  const response = await axios.get(BASE_URL + "/resources/image", {
    auth,
    params: {
      next_cursor: req.query.next_cursor,
    },
  });
  return res.send(response.data);
});

app.get("/search", async (req, res) => {
  const response = await axios.get(BASE_URL + "/resources/search", {
    auth,
    params: {
      expression: req.query.expression,
    },
  });

  return res.send(response.data);
});

app.listen(process.env.PORT || 3000, function () {
  console.log("listening on *:3000");
});
