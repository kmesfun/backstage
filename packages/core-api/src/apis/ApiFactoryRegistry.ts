/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ApiFactoryHolder,
  ApiFactory,
  AnyApiRef,
  AnyApiFactory,
} from './types';
import { ApiRef } from './ApiRef';

type ApiFactoryScope =
  | 'default' // Default factories registered by core and plugins
  | 'app' // Factories registered in the app, overriding default ones
  | 'static'; // APIs that can't be overridden, e.g. config

enum ScopePriority {
  default = 10,
  app = 50,
  static = 100,
}

type FactoryTuple = {
  priority: number;
  factory: AnyApiFactory;
};

/**
 * ApiFactoryRegistry is an ApiFactoryHolder implementation that enables
 * registration of API Factories with different scope.
 *
 * Each scope has an assigned priority, where factories registered with
 * higher priority scopes override ones with lower priority.
 */
export class ApiFactoryRegistry implements ApiFactoryHolder {
  private readonly factories = new Map<AnyApiRef, FactoryTuple>();

  /**
   * Register a new API factory. Returns true if the factory was added
   * to the registry.
   *
   * A factory will not be added to the registry if there is already
   * an existing factory with the same or higher priority.
   */
  register<Api, Deps extends { [name in string]: unknown }>(
    scope: ApiFactoryScope,
    factory: ApiFactory<Api, Deps>,
  ) {
    const priority = ScopePriority[scope];
    const existing = this.factories.get(factory.api);
    if (existing && existing.priority >= priority) {
      return false;
    }

    this.factories.set(factory.api, { priority, factory });
    return true;
  }

  get<T>(api: ApiRef<T>): ApiFactory<T, { [x: string]: unknown }> | undefined {
    const tuple = this.factories.get(api);
    if (!tuple) {
      return undefined;
    }
    return tuple.factory as ApiFactory<T, { [x: string]: unknown }>;
  }

  getAllApis(): Set<AnyApiRef> {
    return new Set(this.factories.keys());
  }
}
