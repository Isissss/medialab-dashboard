"use client";

import { EmbedBuilder } from "@discordjs/builders";
import { sendDiscordWebhook } from "./actions";
import { toast } from "../ui/Toast/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import HoveringMenuExample from "./page";
import { uploadFiles } from "@/lib/uploadthing";
import { Input } from "../ui/input";
import { Image } from "lucide-react";

export function IntroPage() {
  const [messageContent, setMessageContent] = useState({
    title: "wadwdw",
    description: "",
    color: 0xff0000,
    image: undefined,
    url: undefined,
    thumbnail: undefined,
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessageContent((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  }

  const handleSubmit = async () => {
    console.log(messageContent);
    const embed = new EmbedBuilder()
      .setTitle(messageContent.title)
      .setDescription(messageContent.description)
      .setImage(messageContent.image || null)
      .setThumbnail(messageContent.thumbnail || null)
      .setURL(messageContent.url || null)
      .setColor(messageContent.color)
      .setTimestamp();

   // const success = await sendDiscordWebhook(embed);
    const success = true;
    toast({
      title: success ? "Gelukt!" : "Er ging iets mis..",
      description: success ? "Bericht is verstuurd!" : "Er was een probleem, probeer het later opnieuw.",
      variant: success ? "default" : "destructive",
    });
  };



  return (
    <>  
      <Card className="max-w-[520px] flex">
      <div className="w-1 bg-orange-400 rounded-l-lg" /> 
      <div>
        <CardHeader>
          <CardTitle>Push een bericht</CardTitle>
          <CardDescription>
            Push een bericht naar alle Discord servers met de Discord bot.
          </CardDescription>
        </CardHeader>
        <CardContent>

          <div className="flex flex-row gap-x-4 w-full mb-8">
            <div className="w-full  flex flex-col justify-between">
              <div className="mb-4 w-full items-center gap-1.5 ">
                <Label htmlFor="title">Titel</Label>
                <Input name="title" id="title" placeholder="title" onChange={onChangeHandler} value={messageContent.title} />
              </div>
              <div className="w-full items-center gap-1.5">
                <Label htmlFor="url">Titel URL (optioneel)</Label>
                <p className="text-xs text-gray-500 mb-3">Als de titel een link moet zijn, vul hier de URL in.</p>
                <Input name="url" id="url" placeholder="title" onChange={onChangeHandler} value={messageContent.url} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="thumbnail">Thumbnail foto</Label>
              <input onChange={async (e) => {
                if (!e.target.files) return;

                const images = Array.from(e.target.files);


                const file = await uploadFiles("imageUploader", {
                  files: images
                });


                setMessageContent((prev) => ({
                  ...prev,
                  thumbnail: file[0].url,
                }));
              }}

                className="hidden" type="file" name="thumbnail" id="thumbnail" />

              <div className="relative h-40 w-40  border-2 border-dashed  rounded-lg">
                <label className="w-full h-full flex justify-center items-center cursor-pointer" htmlFor="thumbnail">
                  {messageContent.thumbnail ? <img src={messageContent.thumbnail} alt="thumbnail" className="h-full w-full object-cover" /> : <Image size={40} />}
                </label>
              </div>
            </div>
          </div>
          <HoveringMenuExample updateObj={setMessageContent} />
          <Label htmlFor="image">Grote foto</Label>
          <input onChange={async (e) => {
            if (!e.target.files) return;

            const images = Array.from(e.target.files);


            const file = await uploadFiles("imageUploader", {
              files: images
            });


            setMessageContent((prev) => ({
              ...prev,
              image: file[0].url,
            }));
          }}

            className="hidden" type="file" name="test" id="test" />

          <div className="relative w-full min-h-40   border-2 border-dashed  rounded-md">
            <label className=" min-h-40 w-full h-full flex justify-center items-center cursor-pointer" htmlFor="test">
              {messageContent.image ? <img src={messageContent.image} alt="image" className="h-full w-auto object-cover" /> : <Image size={40} />}
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleSubmit}>Deploy</Button>
        </CardFooter>
        </div>
      </Card> 
    </>
  );
}

