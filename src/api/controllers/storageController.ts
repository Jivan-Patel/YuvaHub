import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { dbCommand, dbQuery } from "../db.js";
// @ts-ignore
import multer from "multer";

export const handleSignatureRequest = async (req: any, res: any) => {
  try {
    const user = req.user;
    const { fileType, extension } = req.body;

    if (!fileType || !extension) {
      return res.status(400).json({ error: "Missing fileType or extension" });
    }

    const normalizedExt = extension.toLowerCase().replace(/^\./, "");
    const allowedExtensions = ["pdf", "png", "jpeg", "jpg"];
    if (!allowedExtensions.includes(normalizedExt)) {
      return res.status(400).json({ error: "Unsupported file type. Only .pdf, .png, and .jpeg are allowed." });
    }

    let folder = "";
    if (fileType === "resume") {
      folder = `yuvahub/resumes/${user.uid}`;
    } else if (fileType === "cover_letter") {
      folder = `yuvahub/cover_letters/${user.uid}`;
    } else if (fileType === "avatar") {
      folder = `yuvahub/avatars/${user.uid}`;
    } else {
      return res.status(400).json({ error: "Invalid fileType" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign: Record<string, any> = { timestamp, folder };

    if (fileType === "resume" || fileType === "cover_letter") {
      paramsToSign.allowed_formats = "pdf";
    } else if (fileType === "avatar") {
      paramsToSign.allowed_formats = "png,jpg,jpeg";
    }

    if (fileType === "resume" || fileType === "cover_letter") {
      if (normalizedExt !== "pdf") {
        return res.status(400).json({ error: "Resumes and cover letters must be PDF format." });
      }
    } else if (fileType === "avatar") {
      if (!["png", "jpg", "jpeg"].includes(normalizedExt)) {
        return res.status(400).json({ error: "Avatars must be PNG or JPEG format." });
      }
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    if (!apiSecret) {
      if (process.env.NODE_ENV !== "production") {
        return res.json({
          signature: "dummy_signature",
          timestamp,
          folder,
          allowed_formats: paramsToSign.allowed_formats,
          apiKey: "dummy_key",
          cloudName: "dummy_cloud",
          isDummy: true
        });
      }
      return res.status(500).json({ error: "Cloudinary API Secret not configured." });
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({
      signature,
      timestamp,
      folder,
      allowed_formats: paramsToSign.allowed_formats,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });

  } catch (err: any) {
    console.error("[Storage] Error generating signature:", err);
    res.status(err.message?.startsWith("Unauthorized") ? 401 : 500).json({ error: err.message || "Internal Server Error" });
  }
};

export const handleSaveUpload = async (req: any, res: any) => {
  try {
    const user = req.user;
    const { type, url, publicId } = req.body;

    if (!type || !url || !publicId) {
      return res.status(400).json({ error: "Missing type, url, or publicId" });
    }

    if (!["avatar", "resume", "cover_letter"].includes(type)) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    if (!dbCommand || !dbQuery) {
      return res.status(503).json({ error: "Database not available" });
    }

    const usersCollection = dbQuery.collection("users");

    const updateFields: Record<string, any> = {
      updatedAt: new Date()
    };

    if (type === "avatar") {
      updateFields.avatarUrl = url;
      updateFields.avatarPublicId = publicId;
    } else if (type === "resume") {
      updateFields.resumeUrl = url;
      updateFields.resumePublicId = publicId;

      try {
        const resumesCol = dbCommand.collection("resumes");
        const existingCount = await resumesCol.countDocuments({ userId: user.uid });
        const isDefault = existingCount === 0 || req.body.isDefault !== false;

        if (isDefault) {
          await resumesCol.updateMany({ userId: user.uid }, { $set: { isDefault: false } });
        }

        const now = new Date();
        const origName = req.body.originalFileName || req.body.fileName || "resume.pdf";
        const dispName = req.body.displayName || origName;

        await resumesCol.insertOne({
          userId: user.uid,
          displayName: dispName,
          originalFileName: origName,
          fileUrl: url,
          publicId: publicId || "",
          uploadedAt: now,
          updatedAt: now,
          isDefault
        });
      } catch (resErr) {
        console.error("[Storage] Failed to save resume history entry:", resErr);
      }
    } else if (type === "cover_letter") {
      updateFields.coverLetterUrl = url;
      updateFields.coverLetterPublicId = publicId;
    }

    await usersCollection.updateOne({ uid: user.uid }, { $set: updateFields });
    const updatedProfile = await usersCollection.findOne({ uid: user.uid });

    if (!updatedProfile) {
      return res.status(404).json({ error: "User profile not found in database" });
    }

    if (updatedProfile._id) {
      updatedProfile.id = updatedProfile._id.toString();
      delete updatedProfile._id;
    }

    res.json({
      status: "success",
      profile: updatedProfile
    });

  } catch (err: any) {
    console.error("[Storage] Error saving upload metadata:", err);
    res.status(err.message?.startsWith("Unauthorized") ? 401 : 500).json({ error: err.message || "Internal Server Error" });
  }
};

export const localUpload = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const dir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req: any, file: any, cb: any) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

export const handleLocalUpload = async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      secure_url: publicUrl,
      public_id: req.file.filename,
      format: path.extname(req.file.filename).replace('.', '')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to handle local upload" });
  }
};
