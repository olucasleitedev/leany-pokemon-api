import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check da aplicação' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        Promise.resolve({
          rabbitmq: {
            status: this.amqpConnection.managedConnection.isConnected()
              ? 'up'
              : 'down',
          },
        }),
    ]);
  }
}
