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
import Prism from "prismjs";
import "prismjs/components/prism-markdown";
import { Label } from "@/components/ui/label";
import { InputWithLabel } from "../ui/InputWithLabel";
import { useState } from "react";
import { Textarea } from "../ui/textarea";

export function IntroPage() {
  const [messageContent, setMessageContent] = useState({
    title: "",
    description: "",
    color: 0xff0000,
  });

  const handleSubmit = () => {
    console.log(messageContent);
    const embed = new EmbedBuilder()
      .setTitle(messageContent.title)
      .setDescription(messageContent.description)
      .setColor(0xff0000);

    sendDiscordWebhook(embed);
    toast({
      title: messageContent.title,
      description: messageContent.description,
    });
  };

  const onChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const code = Prism.highlight(
      e.target.value,
      Prism.languages.markdown,
      "markdown"
    );
    setMessageContent((prev) => ({
      ...prev,
      [e.target.name]: code,
    }));
  };

  return (
    <>
      <Card className="w-[650px]">
        <CardHeader>
          <CardTitle>Push een bericht</CardTitle>
          <CardDescription>
            Push een bericht naar alle Discord servers met de Discord bot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <InputWithLabel
                  id="title"
                  inputType="text"
                  placeholder="teswdaawwa"
                  description="test"
                  label="Email"
                  value={messageContent.title}
                  onChange={onChangeHandler}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <p
                    contentEditable
                    role="textbox"
                    id="description"
                    rows={14}
                    placeholder="Type your message here."
                    name="description"
                    value={messageContent.description}
                    onChange={onChangeHandler}
                    content={messageContent.description}
                    onChangeCapture={onChangeHandler}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleSubmit}>Deploy</Button>
        </CardFooter>
      </Card>
    </>
  );
}
