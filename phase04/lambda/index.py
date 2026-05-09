import json
import os
import boto3

sns = boto3.client('sns')
TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event, context):
    for record in event['Records']:
        if record['eventName'] != 'INSERT':
            continue

        new_image = record['dynamodb']['NewImage']
        rating   = new_image['rating']['N']
        comment  = new_image['comment']['S']
        user_name = new_image['userName']['S']
        created_at = new_image['createdAt']['S']

        message = (
            f"新しいレビューが投稿されました\n"
            f"\n"
            f"名前: {user_name}\n"
            f"評価: {'★' * int(rating)}{'☆' * (5 - int(rating))} ({rating}/5)\n"
            f"コメント: {comment}\n"
            f"\n"
            f"投稿日時: {created_at}"
        )

        sns.publish(
            TopicArn=TOPIC_ARN,
            Message=message,
            Subject="【ハンズオンアプリ】新しいレビューが届きました"
        )
        print(f"SNS通知送信完了: userName={user_name}, rating={rating}")

    return {'statusCode': 200, 'body': json.dumps('OK')}
