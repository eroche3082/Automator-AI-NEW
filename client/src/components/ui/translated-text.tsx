import React, { ReactNode } from "react";
import { useTranslatedText } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import { TextToSpeech } from "@/components/ui/text-to-speech";

interface TranslatedTextProps {
  text: string;
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  withTTS?: boolean; // Add text-to-speech button
  children?: ReactNode;
  [key: string]: any; // For any other props
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  as: Component = "span",
  className = "",
  withTTS = false,
  children,
  ...props
}) => {
  const { translatedText, isTranslating } = useTranslatedText(text);
  
  if (isTranslating) {
    return <Skeleton className={`h-4 w-24 ${className}`} />;
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Component className={className} {...props}>
        {translatedText}
        {children}
      </Component>
      {withTTS && <TextToSpeech text={translatedText} />}
    </div>
  );
};

export default TranslatedText;