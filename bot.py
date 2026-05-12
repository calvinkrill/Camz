import discord
from discord.ext import commands
import os
import aiohttp
from aiohttp import web
import asyncio
import json
from datetime import datetime

# Load environment variables
token = os.getenv("DISCORD_TOKEN")

# Bot Setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

logs = []

def add_log(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] [Python] {msg}"
    logs.append(log_entry)
    if len(logs) > 100:
        logs.pop(0)
    print(log_entry)

@bot.event
async def on_ready():
    add_log(f"Logged in as {bot.user.name} ({bot.user.id})")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    add_log(f"Message from {message.author}: {message.content}")
    await bot.process_commands(message)

# Internal API to communicate with the Node.js Dashboard
async def handle_send_message(request):
    try:
        data = await request.json()
        channel_id = int(data.get("channelId"))
        content = data.get("message")
        
        channel = bot.get_channel(channel_id)
        if channel:
            await channel.send(content)
            add_log(f"Sent message to {channel_id}: {content}")
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": "Channel not found"}, status=404)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_get_status(request):
    return web.json_response({
        "status": "online" if bot.is_ready() else "connecting",
        "tag": str(bot.user) if bot.user else "N/A",
        "guildCount": len(bot.guilds),
        "userCount": len(bot.users),
        "uptime": "N/A" # Simplified
    })

async def handle_get_logs(request):
    return web.json_response({"logs": logs})

async def run_internal_api():
    app = web.Application()
    app.router.add_post("/send-message", handle_send_message)
    app.router.add_get("/status", handle_get_status)
    app.router.add_get("/logs", handle_get_logs)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 5000)
    await site.start()
    add_log("Internal API listening on port 5000")

async def main():
    # Start the internal API and the Bot concurrently
    if not token:
        add_log("No DISCORD_TOKEN found. Python bot waiting...")
        return

    await asyncio.gather(
        run_internal_api(),
        bot.start(token)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
