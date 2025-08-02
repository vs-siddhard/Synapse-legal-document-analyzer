import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// CORS configuration
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["*"],
  }),
);

app.use("*", logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Create storage bucket on startup
const initializeStorage = async () => {
  const bucketName = "make-0cfdab42-legal-documents";
  const { data: buckets } =
    await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(
    (bucket) => bucket.name === bucketName,
  );

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(
      bucketName,
      {
        public: false,
        allowedMimeTypes: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
        ],
      },
    );
    if (error) {
      console.log("Error creating bucket:", error);
    } else {
      console.log(
        "Legal documents bucket created successfully",
      );
    }
  }
};

// Initialize storage on startup
initializeStorage();

// Authentication middleware
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req
    .header("Authorization")
    ?.split(" ")[1];
  if (!accessToken) {
    return c.json(
      { error: "Authorization header required" },
      401,
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", user.id);
  c.set("user", user);
  await next();
};

// User registration
app.post("/make-server-0cfdab42/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } =
      await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        // Automatically confirm the user's email since an email server hasn't been configured
        email_confirm: true,
      });

    if (error) {
      console.log("Signup error:", error);
      return c.json(
        { error: "Failed to create user account" },
        400,
      );
    }

    // Initialize user profile
    await kv.set(`user_profile:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      created_at: new Date().toISOString(),
      documents_analyzed: 0,
      subscription_tier: "free",
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log("Signup error:", error);
    return c.json(
      { error: "Failed to process signup request" },
      500,
    );
  }
});

// Get user profile
app.get(
  "/make-server-0cfdab42/profile",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const profile = await kv.get(`user_profile:${userId}`);

      if (!profile) {
        return c.json({ error: "Profile not found" }, 404);
      }

      return c.json({ profile });
    } catch (error) {
      console.log("Profile fetch error:", error);
      return c.json({ error: "Failed to fetch profile" }, 500);
    }
  },
);

// Update user profile
app.put(
  "/make-server-0cfdab42/profile",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const updates = await c.req.json();

      const currentProfile = await kv.get(
        `user_profile:${userId}`,
      );
      if (!currentProfile) {
        return c.json({ error: "Profile not found" }, 404);
      }

      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await kv.set(`user_profile:${userId}`, updatedProfile);

      return c.json({ profile: updatedProfile });
    } catch (error) {
      console.log("Profile update error:", error);
      return c.json({ error: "Failed to update profile" }, 500);
    }
  },
);

// Upload document
app.post(
  "/make-server-0cfdab42/documents/upload",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const fileName =
        (formData.get("fileName") as string) || file.name;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          {
            error:
              "Invalid file type. Please upload PDF or Word documents only.",
          },
          400,
        );
      }

      // Generate unique file path
      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}.${fileExtension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("make-0cfdab42-legal-documents")
        .upload(uniqueFileName, file);

      if (uploadError) {
        console.log("Upload error:", uploadError);
        return c.json(
          { error: "Failed to upload document" },
          500,
        );
      }

      // Create document record
      const documentId = crypto.randomUUID();
      const document = {
        id: documentId,
        user_id: userId,
        name: fileName,
        file_path: uniqueFileName,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        analysis_status: "pending",
        analysis_progress: 0,
      };

      await kv.set(`document:${documentId}`, document);

      // Start analysis (simulated for demo)
      setTimeout(
        () => simulateAnalysis(documentId, userId),
        1000,
      );

      return c.json({ document });
    } catch (error) {
      console.log("Document upload error:", error);
      return c.json(
        { error: "Failed to process document upload" },
        500,
      );
    }
  },
);

// Get user documents
app.get(
  "/make-server-0cfdab42/documents",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const documents = await kv.getByPrefix(`document:`);

      const userDocuments = documents
        .filter((doc) => doc.user_id === userId)
        .sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime(),
        );

      return c.json({ documents: userDocuments });
    } catch (error) {
      console.log("Documents fetch error:", error);
      return c.json(
        { error: "Failed to fetch documents" },
        500,
      );
    }
  },
);

// Get document analysis
app.get(
  "/make-server-0cfdab42/documents/:id/analysis",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const documentId = c.req.param("id");

      const document = await kv.get(`document:${documentId}`);
      if (!document || document.user_id !== userId) {
        return c.json({ error: "Document not found" }, 404);
      }

      const analysis = await kv.get(`analysis:${documentId}`);

      return c.json({ analysis });
    } catch (error) {
      console.log("Analysis fetch error:", error);
      return c.json({ error: "Failed to fetch analysis" }, 500);
    }
  },
);

// Get document file URL
app.get(
  "/make-server-0cfdab42/documents/:id/file",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const documentId = c.req.param("id");

      const document = await kv.get(`document:${documentId}`);
      if (!document || document.user_id !== userId) {
        return c.json({ error: "Document not found" }, 404);
      }

      const {
        data: { signedUrl },
        error,
      } = await supabase.storage
        .from("make-0cfdab42-legal-documents")
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.log("Signed URL error:", error);
        return c.json(
          { error: "Failed to generate file URL" },
          500,
        );
      }

      return c.json({ url: signedUrl });
    } catch (error) {
      console.log("File URL error:", error);
      return c.json({ error: "Failed to get file URL" }, 500);
    }
  },
);

// AI Legal Assistant Chat
app.post(
  "/make-server-0cfdab42/chat",
  requireAuth,
  async (c) => {
    try {
      const { message, documentId, context } =
        await c.req.json();

      // Simulate AI response (in production, this would call IBM Watson/Granite LLM)
      const responses = [
        "Based on the clause you've highlighted, this appears to be a standard liability limitation provision. However, I notice it may not adequately protect against gross negligence.",
        "This termination clause allows either party to terminate with 30 days notice. You might want to consider adding specific termination triggers for breach of contract.",
        "The confidentiality provision looks comprehensive, but consider adding a clause about return of confidential information upon contract termination.",
        "This indemnification clause is quite broad. You may want to negotiate for mutual indemnification to balance the risk allocation.",
        "The intellectual property clause needs clarification on who owns derivative works created during the collaboration.",
      ];

      const response =
        responses[Math.floor(Math.random() * responses.length)];

      return c.json({
        response,
        suggestions: [
          "Review similar clauses in other documents",
          "Compare against industry standards",
          "Flag for legal review",
        ],
      });
    } catch (error) {
      console.log("Chat error:", error);
      return c.json(
        { error: "Failed to process chat message" },
        500,
      );
    }
  },
);

// Simulate document analysis (in production, this would integrate with IBM Watson/Granite LLM)
async function simulateAnalysis(
  documentId: string,
  userId: string,
) {
  const stages = [
    {
      stage: "extracting",
      progress: 25,
      message: "Extracting clauses from document...",
    },
    {
      stage: "classifying",
      progress: 50,
      message: "Classifying clause types...",
    },
    {
      stage: "analyzing",
      progress: 75,
      message: "Analyzing risk factors...",
    },
    {
      stage: "complete",
      progress: 100,
      message: "Analysis complete",
    },
  ];

  for (const stage of stages) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update document status
    const document = await kv.get(`document:${documentId}`);
    if (document) {
      document.analysis_status = stage.stage;
      document.analysis_progress = stage.progress;
      await kv.set(`document:${documentId}`, document);
    }
  }

  // Create mock analysis results
  const analysis = {
    document_id: documentId,
    clauses: [
      {
        id: "1",
        type: "liability",
        text: "The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages...",
        risk_score: 7,
        explanation:
          "High risk - Very broad liability limitation that may not be enforceable in all jurisdictions.",
        suggestions: [
          "Consider mutual liability limitations",
          "Add carve-outs for gross negligence",
        ],
      },
      {
        id: "2",
        type: "termination",
        text: "Either party may terminate this agreement with thirty (30) days written notice...",
        risk_score: 4,
        explanation:
          "Medium risk - Standard termination clause but lacks specific breach triggers.",
        suggestions: [
          "Add termination for cause provisions",
          "Specify cure periods",
        ],
      },
      {
        id: "3",
        type: "confidentiality",
        text: "Each party agrees to maintain in confidence all Confidential Information...",
        risk_score: 2,
        explanation:
          "Low risk - Well-structured confidentiality provision with proper definitions.",
        suggestions: [
          "Consider adding return of materials clause",
        ],
      },
    ],
    summary:
      "This contract contains standard commercial terms with some areas requiring attention. The liability limitation clause is particularly broad and may need revision.",
    overall_risk_score: 4.3,
    missing_clauses: [
      "Force Majeure",
      "Dispute Resolution",
      "Governing Law",
    ],
    compliance_score: 78,
    analyzed_at: new Date().toISOString(),
  };

  await kv.set(`analysis:${documentId}`, analysis);

  // Update user stats
  const profile = await kv.get(`user_profile:${userId}`);
  if (profile) {
    profile.documents_analyzed =
      (profile.documents_analyzed || 0) + 1;
    await kv.set(`user_profile:${userId}`, profile);
  }
}

serve(app.fetch);