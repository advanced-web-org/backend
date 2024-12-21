import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Consumer[] = [];

  // constructor() {
  //   this.kafka = new Kafka({
  //     clientId: 'nestjs-app',
  //     brokers: ['localhost:9092'],
  //   });
  //   this.producer = this.kafka.producer();
  // }

  // async onModuleInit() {
  //   await this.producer.connect();
  // }

  async produce<Type>(topic: string, message: Type) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consume<Type>(topic: string, groupId: string, callback: (message: Type) => void) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const parsedMessage = message.value ? JSON.parse(message.value.toString()) : null;
        callback(parsedMessage);
      },
    });
    this.consumers.push(consumer);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
