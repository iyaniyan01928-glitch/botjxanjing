const {
Client,
GatewayIntentBits,
ActionRowBuilder,
StringSelectMenuBuilder,
ButtonBuilder,
ButtonStyle,
EmbedBuilder,
PermissionsBitField
} = require("discord.js");

const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const PREFIX = "!";
const STAFF_ROLE = "STAFF_ROLE_ID";
const CATEGORY_ID = "CATEGORY_ID";
const LOG_CHANNEL = "LOG_CHANNEL_ID";

client.once("ready",()=>{
console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on("messageCreate", async message=>{

if(message.author.bot) return;

if(message.content === "!ticket2"){

const embed = new EmbedBuilder()
.setTitle("🛒 Order Panel")
.setDescription("Silahkan pilih jenis order.")
.setColor("Blue");

const menu = new StringSelectMenuBuilder()
.setCustomId("order_menu")
.setPlaceholder("Pilih order")
.addOptions([
{label:"Order Bot",value:"bot"},
{label:"Order Hosting",value:"hosting"},
{label:"Order Lainnya",value:"other"}
]);

const row = new ActionRowBuilder().addComponents(menu);

message.channel.send({
embeds:[embed],
components:[row]
});

}

if(message.content.startsWith("!add")){

const user = message.mentions.users.first();
if(!user) return;

message.channel.permissionOverwrites.create(user,{
ViewChannel:true,
SendMessages:true
});

message.channel.send(`✅ ${user} ditambahkan ke ticket`);

}

if(message.content.startsWith("!remove")){

const user = message.mentions.users.first();
if(!user) return;

message.channel.permissionOverwrites.delete(user);

message.channel.send(`❌ ${user} dihapus dari ticket`);

}

if(message.content.startsWith("!rename")){

const name = message.content.split(" ").slice(1).join(" ");
if(!name) return;

message.channel.setName(name);

}

});

client.on("interactionCreate", async interaction=>{

if(interaction.isStringSelectMenu()){

if(interaction.customId === "order_menu"){

const existing = interaction.guild.channels.cache.find(
c => c.topic === interaction.user.id
);

if(existing){
return interaction.reply({
content:`Kamu sudah punya ticket: ${existing}`,
ephemeral:true
});
}

const channel = await interaction.guild.channels.create({
name:`ticket-${interaction.user.username}`,
type:0,
topic:interaction.user.id,
parent:CATEGORY_ID,
permissionOverwrites:[
{
id:interaction.guild.id,
deny:[PermissionsBitField.Flags.ViewChannel]
},
{
id:interaction.user.id,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},
{
id:STAFF_ROLE,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}
]
});

const embed = new EmbedBuilder()
.setTitle("📋 Format Order")
.setDescription(`
Silahkan isi format berikut

Nama:
Produk:
Budget:
Detail Order:
`)
.setColor("Green");

const close = new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("Close Ticket")
.setStyle(ButtonStyle.Danger);

const row = new ActionRowBuilder().addComponents(close);

channel.send({
content:`<@${interaction.user.id}> <@&${STAFF_ROLE}>`,
embeds:[embed],
components:[row]
});

interaction.reply({
content:`Ticket dibuat ${channel}`,
ephemeral:true
});

}

}

if(interaction.isButton()){

if(interaction.customId === "close_ticket"){

const messages = await interaction.channel.messages.fetch({limit:100});

let transcript = "";

messages.reverse().forEach(msg=>{
transcript += `${msg.author.tag}: ${msg.content}\n`;
});

fs.writeFileSync(`transcript-${interaction.channel.id}.txt`, transcript);

const log = interaction.guild.channels.cache.get(LOG_CHANNEL);

if(log){

const embed = new EmbedBuilder()
.setTitle("📁 Ticket Closed")
.addFields(
{name:"Ticket",value:interaction.channel.name},
{name:"Closed By",value:`<@${interaction.user.id}>`}
)
.setTimestamp()
.setColor("Red");

log.send({
embeds:[embed],
files:[`transcript-${interaction.channel.id}.txt`]
});

}

interaction.channel.delete();

}

}

});

client.login("TOKEN_BOT");
