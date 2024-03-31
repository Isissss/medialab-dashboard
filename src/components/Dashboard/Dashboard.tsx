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
import SlateEditor from "../SlateEditor";
import { uploadFiles } from "@/lib/uploadthing";
import { Image as ImageIcon } from "lucide-react";
import { InputWithLabel } from "../ui/InputWithLabel";
import NextImage from "next/image";

export function Dashboard() {
  const [messageContent, setMessageContent] = useState({
    title: "",
    description: undefined,
    color: 0xF97316,
    image: undefined,
    titleUrl: undefined,
    thumbnail: undefined,
  });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessageContent((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  }

  const uploadImage = async (img: File | null) => {
    if (!img) return;

    try {
      const file = await uploadFiles("imageUploader", {
        files: [img]
      });

      return file[0].url;
    } catch (error) {
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let success = false;
    setLoading(true);

    toast({
      title: "Upload begonnen!",
      description: "Even geduld aub.."
    });

    try {
      const { title, description, color, image, titleUrl } = messageContent;

      // upload images
      const [bigImage, thumbnail] = await Promise.all([
        uploadImage(messageContent.image?.file),
        uploadImage(messageContent.thumbnail?.file)
      ]);

      const embed = new EmbedBuilder().setColor(color).setTimestamp();
      title && embed.setTitle(title)
      description && embed.setDescription(description)
      image && embed.setImage(bigImage)
      titleUrl && embed.setURL(titleUrl)
      thumbnail && embed.setThumbnail(thumbnail)

      success = await sendDiscordWebhook(JSON.stringify(embed));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);

      toast({
        title: success ? "Gelukt!" : "Er ging iets mis..",
        description: success ? "Bericht is verstuurd!" : "Er was een probleem, probeer het later opnieuw.",
        variant: success ? "default" : "destructive",
      })
    }
  };

  const onThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const img = new Image();
    img.src = URL.createObjectURL(e.target.files[0]);

    setMessageContent((prev) => ({
      ...prev,
      thumbnail: {
        src: img.src,
        file: e.target.files[0]
      }
    }));
  }

  const onBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const img = new Image();
    img.src = URL.createObjectURL(e.target.files[0]);

    setMessageContent((prev) => ({
      ...prev,
      image: {
        src: img.src,
        file: e.target.files[0]
      }
    }));
  }

  return (
    <Card className="max-w-[560px] w-full flex mx-auto">
      <div className="w-1 bg-orange-400 rounded-l-lg" />
      <div className="w-full">
        <CardHeader>
          <CardTitle>Push een bericht</CardTitle>
          <CardDescription>
            Push een bericht naar alle Discord servers met de Discord bot.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSubmit(e)}  >
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 w-full mb-8">
              <div className="w-full flex flex-col justify-between gap-4">
                <InputWithLabel id="title" required placeholder="Vul hier de titel in" onChange={onChangeHandler} value={messageContent.title} inputType={"text"} label="Titel" />
                <InputWithLabel id="titleUrl" placeholder="Vul hier de URL van de titel in" onChange={onChangeHandler} value={messageContent.titleUrl} inputType={"text"} label="Titel URL (optioneel)" description={"Als de titel een link moet zijn, vul hier de URL in."} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="thumbnail">Thumbnail foto</Label>
                <input className="hidden" type="file" name="thumbnail" id="thumbnail" onChange={onThumbnailUpload} />
                <div className="relative h-36 w-36  border-2 border-dashed  rounded-lg">
                  <label className="w-full h-full flex justify-center items-center cursor-pointer" htmlFor="thumbnail">
                    {messageContent.thumbnail ? <NextImage fill src={messageContent.thumbnail.src} alt="thumbnail" className="h-full w-full object-cover" /> : <ImageIcon size={40} />}
                  </label>
                </div>
              </div>
            </div>
            <SlateEditor onUpdate={(value) => setMessageContent((prev) => ({ ...prev, description: value }))} />
            <Label htmlFor="image">Grote foto (optioneel)</Label>
            <input onChange={onBannerImageUpload}
              className="hidden" type="file" name="image" id="image" />
            <div className="  w-full min-h-40 h-full border-2 border-dashed rounded-md">
              <label className="min-h-40   h-full flex justify-center items-center cursor-pointer" htmlFor="image">
                {messageContent.image ? <NextImage width={600} height={400} src={messageContent.image.src} alt="image" className="h-full w-auto object-cover" /> : <ImageIcon size={40} />}
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button disabled={loading} > {loading ? "Even geduld.." : "Verstuur bericht"}</Button>
          </CardFooter>
        </form>
      </div>
    </Card>
  );
}

