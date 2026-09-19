-- 0012で作成したstorage.objectsポリシーのバグ修正。
-- サブクエリ内の`chat_conversations`に`name`列があるため、`storage.foldername(name)`の`name`が
-- 意図せず`chat_conversations.name`(会話名)に束縛され、storage.objects.name(ファイルパス)を
-- 見ていなかった(常に条件不成立でアップロード不可になっていた)。`objects.name`と明示的に修飾する。
drop policy "chat_images_select" on storage.objects;
drop policy "chat_images_insert" on storage.objects;

create policy "chat_images_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-images' and (
      public.current_role() = 'manager'
      or exists (
        select 1 from public.chat_conversations c
        where c.id::text = (storage.foldername(objects.name))[1]
          and (c.type = 'broadcast' or public.is_chat_member(c.id))
      )
    )
  );
create policy "chat_images_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images' and exists (
      select 1 from public.chat_conversations c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (
          (c.type = 'broadcast' and public.current_role() = 'manager')
          or (c.type in ('dm','group') and public.is_chat_member(c.id))
        )
    )
  );
