# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for hosting your workout spot images.

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account (if you don't have one)
3. No credit card required for R2 free tier!

## Step 2: Enable R2

1. Log in to Cloudflare Dashboard
2. Click **R2** in the left sidebar
3. Click **Purchase R2** (it's free up to 10GB!)
4. Accept the terms

## Step 3: Create R2 Bucket

1. In R2 dashboard, click **Create bucket**
2. **Bucket name:** `outdoor-workout-images` (or your preferred name)
3. **Location:** Automatic (recommended) or choose closest to your users
4. Click **Create bucket**

## Step 4: Enable Public Access

1. Click on your newly created bucket
2. Go to **Settings** tab
3. Scroll to **Public access**
4. Click **Allow Access**
5. Click **Connect Domain** (optional but recommended for custom domain)
   - Or use the default R2.dev subdomain: `https://pub-xxxxx.r2.dev`

**Important:** Copy your public bucket URL! It will look like:
- `https://pub-abc123xyz.r2.dev` (default)
- `https://images.yourdomain.com` (if using custom domain)

## Step 5: Create API Token

1. Go to **Manage R2 API Tokens** (in R2 dashboard)
2. Click **Create API token**
3. **Token name:** `outdoor-workout-upload`
4. **Permissions:**
   - ✅ Object Read & Write
5. **Specify bucket:** Select your bucket
6. Click **Create API Token**

7. **Save these credentials immediately:**
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxx
   Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```
   You won't be able to see the secret key again!

## Step 6: Configure Environment Variables

Create or edit `.env.local` in your project root:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=outdoor-workout-images
R2_PUBLIC_URL=https://pub-abc123xyz.r2.dev
```

**To find your Account ID:**
1. Go to Cloudflare Dashboard
2. Click **R2** in sidebar
3. Your Account ID is shown in the right sidebar

## Step 7: Test Connection

Run the upload script to verify your setup:

```bash
npx tsx scripts/upload-images-to-r2.ts
```

If configured correctly, it will start uploading images!

---

## Custom Domain Setup (Optional but Recommended)

Using a custom domain provides better branding and control:

1. **Add domain to Cloudflare:**
   - Go to **Websites** in Cloudflare Dashboard
   - Add your domain
   - Update nameservers at your registrar

2. **Create R2 custom domain:**
   - In your R2 bucket settings
   - Click **Connect Domain**
   - Enter: `images.yourdomain.com`
   - Cloudflare will automatically create DNS records

3. **Update .env.local:**
   ```bash
   R2_PUBLIC_URL=https://images.yourdomain.com
   ```

---

## Pricing Information

**Free Tier (more than enough for your project):**
- 10 GB storage
- 1 million Class A operations (write/list)
- 10 million Class B operations (read)
- **Zero egress fees** (unlimited bandwidth!)

**After Free Tier:**
- Storage: $0.015/GB/month
- Class A ops: $4.50 per million
- Class B ops: $0.36 per million

**Your 3.4GB of images = FREE** ✅

---

## Troubleshooting

### "Missing R2 credentials" error
- Make sure `.env.local` exists in project root
- Double-check all 5 environment variables are set
- Restart your terminal/IDE after creating `.env.local`

### "Access Denied" error
- Verify API token has Object Read & Write permissions
- Check that bucket name matches exactly
- Ensure public access is enabled on the bucket

### "Connection failed" error
- Verify Account ID is correct
- Check if R2 is enabled on your account
- Try creating a new API token

### Images not loading in browser
- Confirm public access is enabled on bucket
- Check R2_PUBLIC_URL matches your bucket's public URL
- Wait a few minutes for R2 configuration to propagate

---

## Next Steps

After R2 is configured and images are uploaded:

1. Run transform script:
   ```bash
   npx tsx scripts/transform-spots-data.ts
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Your app will now load images from R2! 🎉

---

## Need Help?

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 Public Buckets Guide](https://developers.cloudflare.com/r2/buckets/public-buckets/)
