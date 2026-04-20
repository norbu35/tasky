import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

import { COMMENT_MAX_LENGTH } from './ReviewForm.model';

export function CommentField({
  comment,
  onChangeComment,
}: {
  comment: string;
  onChangeComment: (text: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <FormField label={t('shared.review.label_comment')}>
      <View className="relative rounded-md bg-muted p-xl pb-[32px] min-h-[168px]">
        <Input
          testID="review-comment-input"
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={onChangeComment}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder={t('ReviewFormScreen.copy1')}
          className="min-h-[100px] border-0 bg-transparent px-0 py-0 text-body font-sans text-primary-deep"
        />
        <Text
          className="absolute right-lg bottom-md text-micro font-sans-bold text-text-secondary"
          style={{ letterSpacing: 1 }}
        >{`${comment.length} / ${COMMENT_MAX_LENGTH}`}</Text>
      </View>
    </FormField>
  );
}
